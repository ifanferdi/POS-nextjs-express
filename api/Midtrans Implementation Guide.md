# Rencana Implementasi Midtrans — Backend (Bun + Express.js)

> Dokumen ini adalah rencana arsitektur/flow, bukan kode. Tujuannya jadi acuan implementasi di model/tim lain.

---

## 1. Perubahan Skema

### Order
- **Hapus** field `paymentMethod` dari `Order`. Metode pembayaran sekarang sepenuhnya milik `Payment.method`.
- `Order.status` menjadi satu-satunya sumber kebenaran status transaksi dari sisi bisnis (pending → paid/processing → completed, atau → cancelled/expired).
- `Order.meta` (Json) bisa dipakai sebagai tempat "titipan" data tambahan tanpa migrasi skema baru, misalnya: snapshot response terakhir dari Midtrans, snap_token sementara, expiry time, dsb — kalau kamu tidak mau nambah kolom baru di `Payment`.

### Payment (unified, satu tabel untuk cash & midtrans)
Pemetaan field existing ke dua skenario:

| Field | Cash | Midtrans |
|---|---|---|
| `subtotal` | subtotal sebelum pembulatan | = `total` (karena midtrans tidak butuh pembulatan) |
| `rounding` | hasil pembulatan (mis. ke kelipatan 100/500) | selalu `0` |
| `total` | `subtotal + rounding` | = `subtotal` (tidak dibulatkan) |
| `amount` | uang yang diserahkan customer ke kasir | = `total` (dianggap dibayar penuh saat status `paid`) |
| `change` | `amount - total` | selalu `0` |
| `method` | `cash` | `midtrans` |
| `reference` | no. struk / referensi internal (opsional) | `order_id` yang dikirim ke Midtrans (dan/atau `transaction_id` dari Midtrans — pilih salah satu jadi primary, sisanya taruh di `meta` kalau perlu) |
| `status` | biasanya langsung `paid` (kasir konfirmasi instan) | mengikuti siklus Midtrans: `pending` → `paid`/`failed`/`expired`/`cancelled` |

**Opsional (didiskusikan lagi kalau perlu tambah kolom ke depan):**
- `paidAt` (DateTime?) — waktu status jadi `paid`, berguna untuk laporan.
- `expiredAt` (DateTime?) — deadline pembayaran midtrans, dipakai cron fallback.
- `rawPayload` (Json?) — simpan response terakhir dari Midtrans untuk audit/debug tanpa perlu selalu hit API mereka lagi.

Kalau ingin tanpa migrasi tambahan dulu, taruh info-info di atas sementara di `Order.meta`.

### Enum yang perlu dipastikan konsisten
- `PaymentMethod`: `cash`, `midtrans`
- `PaymentStatus`: `pending`, `paid`, `failed`, `expired`, `cancelled`, (opsional: `refunded`, `partial_refund` kalau mau support refund)
- `OrderStatus`: `pending`, `completed`, `cancelled`, `expired`

---

## 2. Alur Create Order (unified, cash maupun midtrans)

Endpoint: `POST /orders`

1. **Validasi input**: item, qty, harga (harga final dihitung ulang di server, jangan percaya harga dari client).
2. **Cek & lock stock**: untuk tiap `OrderItem`, ambil row `Product` dengan row-lock (`SELECT ... FOR UPDATE` dalam transaksi DB) untuk mencegah race condition saat concurrent checkout.
3. Jika stock cukup untuk semua item → lanjut. Jika ada yang kurang → rollback transaksi, return error jelas (item apa yang stoknya kurang).
4. **Dalam satu DB transaction**:
   - Create `Order` (status: `pending`)
   - Create `OrderItem[]`
   - **Decrement stock** tiap `Product` sesuai qty (ini titik "reservasi stock")
   - Create `Payment`:
     - Jika `method = cash`: hitung `subtotal`, `rounding`, `total`, `amount`, `change` → status langsung `paid` (asumsi kasir sudah terima uang saat order dibuat), `Order.status = completed`/`paid` sesuai alur bisnis kasir kamu.
     - Jika `method = midtrans`: hitung `subtotal = total` (rounding 0), `amount = total`, `change = 0`, status = `pending`. `Order.status = pending`.
5. Commit transaksi.
6. **Khusus midtrans**: setelah transaksi DB commit, panggil **Midtrans Snap API (Create Transaction)**:
   - `transaction_details.order_id`: gunakan `orderNumber` (pastikan unik per attempt — lihat poin "Retry Payment" di bawah untuk kasus order_id dipakai ulang).
   - `transaction_details.gross_amount`: = `Payment.total`.
   - `item_details`: opsional tapi disarankan diisi dari `OrderItem` supaya breakdown di Midtrans dashboard jelas dan totalnya harus match `gross_amount`.
   - `customer_details`: dari data `User`/`customer` kalau ada.
   - Set `expiry` (mis. 15–60 menit) sesuai kebijakan bisnis — ini penting untuk alur expired di bawah.
   - Simpan `snap_token` (dan `redirect_url` kalau pakai Snap redirect, bukan popup) — **jangan simpan permanen di kolom `reference`**, cukup dikembalikan langsung ke response API dan/atau simpan sementara di `Order.meta` supaya bisa di-resume kalau user reload halaman sebelum bayar.
7. Response ke frontend:
   - Cash → data struk/receipt lengkap.
   - Midtrans → `snap_token` (dan/atau `redirect_url`) + `order` + `payment` (status pending).

**Kenapa decrement stock di step create order (bukan nunggu payment sukses)?**
Supaya stock langsung "ter-reserve" begitu order dibuat — mencegah oversell ketika ada banyak order pending bersamaan untuk stock terbatas. Konsekuensinya: sistem **wajib** punya mekanisme rollback stock yang reliable saat order berakhir gagal/batal/expired (lihat bagian 4).

---

## 3. Integrasi Midtrans — Notification/Webhook Handler

Endpoint: `POST /payments/midtrans/notification` (daftarkan URL ini di Midtrans Dashboard → Settings → Configuration).

### Langkah wajib tiap notifikasi masuk:
1. **Jangan langsung percaya body notifikasi.** Ambil `order_id` dari payload, lalu:
   - Verifikasi `signature_key` (SHA512 dari `order_id + status_code + gross_amount + ServerKey`) — kalau tidak match, tolak (401), jangan proses.
   - Setelah signature valid, **panggil ulang Midtrans Get Status API** by `order_id` untuk dapat status transaksi yang benar-benar terkini dari server Midtrans (best practice anti-spoofing, karena body notifikasi bisa saja stale/dipalsukan sebagian).
2. **Cari `Payment`** terkait berdasarkan `reference` (order_id yang cocok) → lalu cari `Order` terkait.
3. **Idempotency check**: jika `Payment.status` sudah dalam status final yang sama (mis. sudah `paid`, notifikasi datang lagi bilang `paid`) → langsung return `200 OK` tanpa proses ulang (mencegah double stock-restore atau efek samping lain).
4. **Mapping status Midtrans → status internal:**

| Midtrans `transaction_status` | `Payment.status` | `Order.status` | Aksi stock |
|---|---|---|---|
| `capture` (fraud_status: `accept`) / `settlement` | `paid` | `paid`/`processing` | tidak ada (stock sudah dikurangi di awal) |
| `capture` (fraud_status: `challenge`) | tetap `pending` (butuh review manual) | tetap `pending` | tidak ada dulu |
| `pending` | `pending` | `pending` | tidak ada |
| `deny` | `failed` | `cancelled` | **restore stock** |
| `cancel` | `cancelled` | `cancelled` | **restore stock** |
| `expire` | `expired` | `expired`/`cancelled` | **restore stock** |
| `refund` / `partial_refund` (opsional) | `refunded` | sesuai kebijakan | biasanya tidak restore stock otomatis (barang sudah terkirim/terpakai) — perlu keputusan bisnis terpisah |

5. Update `Payment` & `Order` dalam **satu DB transaction**, dan jika masuk kategori "restore stock", jalankan proses restore (bagian 4) di transaction yang sama.
6. **Setelah transaksi DB commit**, publish event ke client yang sedang menunggu lewat mekanisme SSE (detail di bagian 6) — kirim status terbaru `Order`/`Payment` ke koneksi SSE yang terkait `orderId` tersebut, kalau ada yang sedang terkoneksi.
7. Selalu response `200 OK` ke Midtrans secepat mungkin (idealnya di bawah beberapa detik) supaya Midtrans tidak retry berlebihan.

---

## 4. Flow Restore Stock (cancel / gagal / expired)

Buat satu fungsi/service reusable, misal `restoreStockForOrder(orderId)`, dipanggil dari 3 tempat: webhook Midtrans, endpoint cancel manual, dan cron fallback.

**Guard wajib sebelum restore:**
- Cek `Order.status` saat ini **belum** berada di status final `cancelled`/`expired`/`failed` — kalau sudah, skip (mencegah double-restore saat notifikasi Midtrans terkirim berkali-kali atau race antara webhook & cron).
- Gunakan DB transaction + row lock di `Product` (sama seperti saat decrement) supaya proses restore juga atomic & aman dari concurrency.

**Langkah:**
1. Ambil semua `OrderItem` milik order tsb.
2. Untuk tiap item, `increment` kembali `Product.stock` sesuai qty.
3. Update `Order.status` → `cancelled`/`expired` (sesuai trigger).
4. Update `Payment.status` → `failed`/`expired`/`cancelled`.
5. (Opsional) catat log/audit trail — kalau nanti ada tabel `StockMovement` atau semacamnya, ini titik yang tepat untuk insert record "restore" supaya traceable.

---

## 5. Endpoint yang Perlu Disiapkan

| Endpoint | Fungsi |
|---|---|
| `POST /orders` | Create order + payment (cash langsung final, midtrans generate snap token) |
| `GET /orders/:id` atau `GET /orders/:id/status` | Cek status terkini secara sekali-tembak (dipakai sebagai fallback manual check, bukan lagi andalan utama untuk menunggu — lihat bagian 6) |
| `GET /orders/:id/events` | **Endpoint SSE** — stream status update real-time selama client menunggu pembayaran (detail di bagian 6) |
| `POST /payments/midtrans/notification` | Webhook dari Midtrans |
| `POST /orders/:id/cancel` | Cancel manual oleh user/kasir (sebelum dibayar) |
| `POST /payments/:id/retry` (opsional) | Generate ulang snap token kalau token lama expired tapi order belum expired, atau user tutup popup tanpa bayar |

### Endpoint cancel manual — detail
1. Cek `Order.status` masih `pending`.
2. Kalau `Payment.method = midtrans` dan status Midtrans masih `pending`, panggil **Midtrans Cancel Transaction API** dulu (supaya transaksi di sisi Midtrans juga resmi dibatalkan, jangan cuma di DB sendiri).
3. Setelah sukses (atau kalau cash yang memang tidak perlu call API eksternal), jalankan `restoreStockForOrder`.

### Endpoint retry payment (opsional tapi disarankan)
Kasus: user menutup popup Snap tanpa membayar, atau snap_token sudah kadaluarsa tapi order belum expired secara bisnis.
- Kalau Midtrans transaction masih `pending` di sisi mereka → cukup generate ulang Snap token pakai `order_id` yang sama (Midtrans support ini selama transaksi belum expired/berakhir).
- Kalau transaksi lama sudah `expire`/`cancel` di Midtrans tapi kamu masih mau kasih kesempatan bayar → buat `order_id` baru dengan suffix (mis. `orderNumber-2`) dan **transaksi Payment baru relasinya tetap ke Order yang sama** — perlu didiskusikan lagi karena skema `Payment` saat ini `orderId` unik (1 order 1 payment). Kalau mau support retry dengan payment attempt baru, ini poin yang perlu kamu putuskan: apakah retry cukup regenerate token di payment yang sama (rekomendasi, lebih simpel & sesuai skema saat ini), atau butuh histori banyak payment per order (butuh ubah skema `orderId` jadi tidak unique + tambah kolom `isActive`/`attempt`).

**Rekomendasi:** pertahankan constraint "1 order 1 payment" seperti sekarang → retry = regenerate token pada `Payment` yang sama selama belum expired. Kalau sudah expired, arahkan user untuk membuat order baru (lebih simpel dan konsisten dengan skema yang kamu punya sekarang).

---

## 6. Real-time Update ke Client — Server-Sent Events (SSE)

Tujuan: begitu webhook Midtrans memproses pembayaran (settlement/expire/deny/cancel), client yang sedang di halaman "menunggu pembayaran" langsung tahu tanpa harus polling terus-menerus.

### Endpoint: `GET /orders/:id/events`

**Alur koneksi:**
1. Client (dari halaman menunggu) buka koneksi SSE ke endpoint ini (pakai `EventSource` di sisi browser).
2. Backend set header standar SSE (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`) dan **tidak menutup response** — koneksi HTTP dibiarkan terbuka.
3. **Autentikasi & otorisasi**: pastikan request berhak mengakses `orderId` tsb (mis. cocokkan dengan `customerId`/`userId` di sesi, atau kalau checkout guest, pakai token sekali-pakai yang dikirim balik dari `POST /orders` khusus untuk akses SSE ini). Catatan: `EventSource` bawaan browser **tidak bisa mengirim custom header** (mis. `Authorization: Bearer ...`), jadi auth biasanya lewat cookie session (kalau same-site) atau query param token yang di-generate sekali pakai dan short-lived.
4. **Kirim status terkini langsung saat koneksi terbuka** (sebelum menunggu event baru) — supaya kalau ternyata status sudah berubah *sebelum* client sempat connect (race condition antara redirect ke halaman tunggu vs webhook yang lebih cepat datang), client tidak perlu nunggu event yang tidak akan pernah dikirim lagi.
5. Simpan koneksi ini di **registry in-memory**, key `orderId` → set of response stream (satu order bisa saja dibuka di beberapa tab/device, jadi harus support banyak listener per order).
6. Saat webhook (bagian 3, langkah 6) atau proses lain mengubah status order tsb → cari registry berdasarkan `orderId` → kirim event `message`/custom event (mis. nama event `payment_status`) berisi status terbaru ke **semua** koneksi yang terdaftar untuk order itu.
7. **Heartbeat**: kirim comment/ping kosong tiap ~15–20 detik supaya koneksi tidak dianggap idle & diputus oleh proxy/load balancer/browser (banyak infra punya default timeout untuk koneksi tanpa aktivitas).
8. **Auto-close saat status final tercapai**: setelah event status final (`paid`/`expired`/`cancelled`/`failed`) terkirim, backend menutup stream dari sisinya sendiri (tidak perlu terus terbuka setelah tidak ada lagi yang perlu ditunggu).
9. **Cleanup saat client disconnect**: dengarkan event close dari request (client tutup tab/koneksi putus) untuk menghapus entry dari registry — mencegah memory leak dari koneksi mati yang masih "nyangkut".
10. **Timeout maksimum**: kalau order tidak kunjung berubah status sampai melewati waktu expiry midtrans, backend boleh menutup koneksi SSE dari sisinya sendiri (kirim event terakhir "expired" kalau memang sudah lewat, atau cukup tutup) — jangan biarkan koneksi menggantung selamanya.

### Catatan penting soal skalabilitas
Registry in-memory (`Map<orderId, Set<response>>`) hanya bekerja benar kalau **backend jalan di satu instance/process**. Kalau nanti deploy dengan multiple instance/container di belakang load balancer:
- Request `POST /payments/midtrans/notification` (webhook) bisa saja diterima instance A, sementara koneksi SSE client sedang terhubung ke instance B → instance A tidak tahu harus push ke mana.
- Solusi umum: pakai **pub/sub** (mis. Redis Pub/Sub) — semua instance subscribe ke channel, saat salah satu instance memproses webhook, publish event ke channel, instance manapun yang punya koneksi SSE untuk `orderId` tsb akan menerima & meneruskan ke client-nya.
- Kalau masih tahap awal / single instance, ini bisa disederhanakan dulu (in-memory saja) dan upgrade ke pub/sub saat mulai scale horizontal — dicatat sebagai technical debt yang disengaja, bukan terlewat.

### Kenapa tetap butuh endpoint status check manual (bagian 5) meskipun sudah ada SSE?
Karena SSE bisa gagal/putus karena banyak sebab di luar kendali kita (jaringan client tidak stabil, browser membatasi koneksi, proxy korporat memblokir streaming, dsb). Endpoint `GET /orders/:id/status` tetap dipertahankan sebagai **fallback wajib**, dipakai backend untuk tombol "Saya sudah melakukan pembayaran" di frontend (detail alurnya di rencana frontend).

---

## 7. Cron Fallback (jaga-jaga notifikasi hilang)

Webhook Midtrans umumnya reliable, tapi jaringan bisa gagal terkirim. Buat scheduled job (mis. tiap 5–10 menit):
1. Query `Order` dengan `status = pending` dan `Payment.method = midtrans` yang sudah melewati waktu expiry (`createdAt + expiry duration`, atau kalau kamu simpan `expiredAt` eksplisit, pakai itu).
2. Untuk tiap order tsb, panggil Midtrans **Get Status API** untuk cross-check status real.
3. Kalau ternyata sudah `expire`/`cancel`/`deny` di sisi Midtrans tapi belum ter-update di DB → jalankan proses yang sama seperti webhook (restore stock + update status).
4. Kalau ternyata `settlement`/`capture` (paid) tapi belum ter-update (notifikasi hilang) → update jadi paid, jangan restore stock.

---

## 7. Keamanan & Reliability

- **Server Key** Midtrans hanya dipakai di backend, jangan pernah expose ke frontend.
- **Client Key** yang dipakai di frontend (untuk load Snap.js).
- Simpan credential di environment variable, beda untuk sandbox vs production.
- Signature verification wajib di setiap notifikasi masuk (lihat bagian 3).
- Idempotency wajib di webhook handler & di proses restore stock.
- Semua operasi yang menyentuh stock harus dalam DB transaction dengan row-level lock.
- Logging: simpan payload notifikasi mentah (sementara, bisa di `Order.meta` atau log terpisah) untuk debugging kalau ada dispute.

---

## 8. Ringkasan Diagram Alur (tekstual)

```
[Create Order]
  → lock & cek stock
  → decrement stock
  → create Order (pending) + Payment
     ├─ cash  → Payment paid, Order paid/completed  (selesai)
     └─ midtrans → Payment pending, Order pending
                    → call Midtrans Snap API → snap_token
                    → return ke frontend

[User bayar via Snap popup] → Midtrans proses pembayaran

[Midtrans kirim webhook] → verifikasi signature → get status API
  ├─ settlement/capture(accept) → Payment paid, Order paid  (stock TIDAK dikembalikan)
  ├─ pending → tidak ada perubahan
  └─ deny/cancel/expire → restore stock → Payment failed/cancelled/expired → Order cancelled/expired

[Cron fallback, tiap beberapa menit] → cek order pending yg lewat expiry → cross-check ke Midtrans → sinkronkan status
```
