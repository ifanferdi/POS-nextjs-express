# Plan Perbaikan Keamanan — Kritikal + Tinggi + Medium

Berdasarkan anotasi Anda di `security-audit.md`. Status: **PLAN — belum dieksekusi.**
12 temuan dikerjakan, 2 skip (#9 prefill kredensial, #11 SSE broadcast), kategori
RENDAH (#16–23) di luar scope untuk sekarang.

## Keputusan desain yang saya tafsirkan (konfirmasi saat eksekusi)

1. **#1/#8 webhook:** `/webhooks/midtrans` tetap publik (gate = verifikasi signature
   Midtrans), `/webhooks/midtrans/mock` → wajib JWT + `Manage Order`, dan di produksi
   mock dinonaktifkan total (404). Alasannya: endpoint mock bisa membuat signature valid.
2. **#6 dashboard:** untuk role `User`, `GET /v1/dashboard` (summary) membalas hanya
   `totalProducts` (mendukung catatan Anda "count total products"); `orders-trend`,
   `payments`, `export` → 403; `orders-by-status` + `top-products` → tetap 200.
   Frontend menyembunyikan section Revenue/Trend/Payments/Export untuk role `User`.
3. **#10 rate limit:** limiter terpisah untuk **login gagal** (10 percobaan/15 menit per
   IP+username — anti brute force) dan limiter umum ringan di route auth (60/menit/IP,
   angka bisa diubah via env) supaya suite E2E (±40 login/run) tidak kena 429.
4. **#4:** rotasi `HASH_SECRET` = semua token lama langsung invalid (logout massal sekali).

---

## Urutan eksekusi (dependensi)

### Tahap 1 — Routing & auth core (fondasi, satu PR)
**#1 + #8 + #2** harus bareng: menghapus fallback user 1 mengubah perilaku lapisan
webhook, jadi router webhook harus benar dulu.

| # | Perubahan | File |
|---|---|---|
| 1 | `const webhook = express.Router()` berisi `POST /webhooks/midtrans` (publik, verifikasi signature) dan `POST /webhooks/midtrans/mock` (JWT + `Manage Order`, 404 bila produksi); daftarkan `app.use(...)`; `RouteNotFoundHandler` jadi tercapai | `api/apps/api/src/adapters/http/routes/index.ts`, `webserver/express.ts` |
| 8 | (hasil sampingan #1) tambah test: unknown route → **404** cepat, bukan hang | — |
| 2 | Hapus `\|\| 1`; tanpa userId → `ErrorUnauthorized` | `api/apps/api/src/use-cases/auth/authorization.ts` |

Validasi: `POST /webhooks/midtrans/mock` tanpa token → 401/403 (bukan hang); unknown
route → 404 <1s; seluruh suite E2E lama tetap hijau (RBAC matrix, POS checkout).

### Tahap 2 — Perbaikan independen (bisa paralel)

| # | Perubahan | File | Catatan |
|---|---|---|---|
| 3 | Validasi `columns` user pakai `USER_SELECT_FIELD` yang **sudah ada** (tanpa password) | `api/apps/api/src/validations/user-validation.ts`, `domain/entities/models/user.ts` | sign-in tidak terpengaruh (pakai fetch internal sendiri) |
| 4 | Wajibkan `HASH_SECRET` (throw saat startup bila kosong), hapus literal fallback, pin `algorithms: ['HS256']` di sign & verify; set env baru di VPS + `docker-compose.yml` + `deploy/.env.example` | `api/apps/api/src/config/config.ts`, `helpers/jwt.helper.ts`, `docker-compose.yml`, `deploy/.env.example` | deploy dulu env baru, baru deploy kode |
| 7 | Blokir `roleId: 1` di `POST/PUT /v1/users` (kecuali caller Developer); blokir `assign-permissions` yang menambah `Show/Manage Permission` ke role sendiri | `api/apps/api/src/use-cases/user/create-user.ts`, `update-user.ts`, `use-cases/role/role-assign-permission.ts` | |
| 13 | Mount `/docs` + aset swagger hanya bila `APP_ENV !== 'production'` | `api/apps/api/src/adapters/http/webserver/express.ts` | index `/` tetap publik (info minimal) |
| 14 | Map `JsonWebTokenError`/`NotBeforeError` → 401; `APP_ENV` selain dev/prod → perilaku produksi (selalu ada respons); stack hanya saat development; matikan `X-Powered-By` | `api/apps/api/src/helpers/jwt.helper.ts`, `webserver/error-handler.ts`, `webserver/express.ts` | |
| 15 | Stok tidak cukup → `ErrorBadRequest` (400); tambah mapper error Prisma di error handler (P2002→409, P2025→404, dll.) agar tidak bocor sebagai 500 | `api/apps/api/src/use-cases/order/create-order.ts`, `webserver/error-handler.ts` | |
| 10 | Tambah `express-rate-limit` (login gagal per IP+username + limiter umum route auth) + `helmet`; threshold via env | `api/apps/api/package.json`, `webserver/express.ts` (atau middleware baru) | konfirmasi angka limiter |

### Tahap 3 — Perubahan perilaku (butuh penyesuaian frontend + E2E)

| # | Perubahan backend | Perubahan frontend |
|---|---|---|
| 5 | `GET /orders/:id`, `PUT /orders/:id/status`, `POST /orders/:id/cancel`: role `User` hanya boleh order milik sendiri (`order.userId === session.id`), selain itu `ErrorForbidden`; Admin/Developer bebas. Utilitas bareng di `authorization-order.ts` | History POS: tangani 403 dari detail order (toast error, kembali ke list) |
| 6 | Gate dashboard: `summary` di-trim untuk role `User` (hanya `totalProducts`), `orders-trend`/`payments`/`export` → 403, `orders-by-status` + `top-products` tetap terbuka | Halaman `/dashboard`: untuk role `User` render hanya KPI Total Products + Orders by Status + Top Products; sembunyikan tombol Export CSV |
| 12 | `POST /uploads/generate-presign-url` → `authorize(['Manage Product','Manage User'])` (OR) | **Cross-check wajib:** pemanggil = upload gambar produk (admin) + foto profil di `/account` (role apa pun). Jika role `User` perlu foto profil: tambah pengecualian self-profile, atau izinkan `Manage Product` OR sesi user sendiri — diputuskan saat eksekusi setelah verifikasi `features/uploads` |

### Tahap 4 — Update suite E2E (mengikuti perilaku baru)

| Test | Perubahan |
|---|---|
| `api/01` token rusak 500 → **401**; tambah unknown-route **404** |
| `api/02` IDOR → user1 GET order milik lain **403**; order milik sendiri tetap 200; dashboard user1 → trend/payments **403**, top-products/orders-by-status 200, summary berisi totalProducts |
| `api/03` stok tidak cukup → **400** (bukan 500) |
| `api/04` `columns[]=password` → **400/kolom ditolak**; `/docs` di produksi → **404**; unknown route + webhook → **404** (bukan hang); `X-Powered-By` hilang |
| `ui/05` + `ui/03` dashboard role `user1` hanya menampilkan section yang diizinkan |
| `ui/04` history POS: order sendiri tetap terbuka (milik user1) — alur checkout tidak berubah |
| Tambah: sign-in gagal berulang → **429** (rate limit) |

## Risiko & catatan

- **#4** invalidasi semua token → pastikan env `HASH_SECRET` baru terpasang di VPS sebelum kode deploy; setelah deploy semua user login ulang (sekali saja).
- **#1** mengubah mock menjadi JWT-gated: fitur "Mock Midtrans Payment" di POS (tombol kondisional) hanya jalan bila token user punya `Manage Order` — user1 punya, aman.
- **#12** risiko paling tinggi salah tebak permission: verifikasi dulu semua pemanggil presign (products + account) sebelum finalisasi gate.
- **#10** limiter bisa bentrok dengan suite E2E bila threshold terlalu rendah — dipilih 60/menit/IP; bila perlu, var env `RATE_LIMIT_*` diset di VPS saja.
- Perubahan Tahap 3 mengubah perilaku produksi (kasir tak lagi melihat data finansial) — komunikasikan ke pengguna POS sebelum rilis.
- Jalankan prettier di file yang diubah (aturan repo api) + lint di repo app.

## Estimasi

- Tahap 1: 1 jam (inti routing, risiko sedang, E2E existing sebagai jaring pengaman)
- Tahap 2: 2–3 jam (8 temuan kecil, kebanyakan satu file)
- Tahap 3: 2 jam (backend + frontend + verifikasi presign)
- Tahap 4: 1–1,5 jam (update test + run penuh UI+API)
- Total ≈ 6–7 jam kerja + 1 deployment terkoordinasi untuk #4.
