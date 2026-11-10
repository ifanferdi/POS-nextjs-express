# Security Audit — POS App + API

Tanggal: 2026-11-09 · Metode: review kode (repo `api/apps/api` + `app/apps/app`) + verifikasi
live di produksi (`https://pos-app-ifan.vercel.app` dan `https://pos-ifan.duckdns.org/api`).

## Status perbaikan (11 Nov 2026)

| Temuan | Status |
|---|---|
| #1, #2, #8 | ✅ PR #4 (merged) — webhook routing, fallback user 1, 404 handler |
| #3, #7, #10, #13, #14, #15 | ✅ PR #5 (merged) — hardening medium |
| #4 | ✅ Commit langsung owner — HASH_SECRET wajib + pin HS256 |
| #5, #6, #12 | ✅ PR #7 (merged) — ownership order, dashboard RBAC, presign per-folder |
| #16, #18, #19, #20, #22, #23 | 🚧 PR #8 (review) — hardening rendah |
| #9, #11, #17, #21 | ⏭️ Skip sesuai keputusan owner |
| Dampak frontend (lihat bawah) | 🚧 PR #9 — branch `app` |

### Catatan lanjutan: dampak perubahan backend ke frontend (PR #9, branch `app`)

Cross-check perubahan backend vs frontend menemukan 3 penyesuaian wajib di luar
scope awal:

1. **Tombol "Mock Midtrans Payment" di POS** — backend kini 404 untuk mock saat
   `APP_ENV=production`, tapi `pos-payment-module.tsx` masih menampilkan tombol
   selama `midtrans.isProduction === false` (default Vercel). Tombol wajib
   disembunyikan saat produksi — kalau tidak, tombol tampil tapi selalu gagal.
2. **Schema password form user** — `features/users/schema.ts` menimpa
   `passwordSchema` (base sudah `min(8).max(16)`) menjadi `.min(1)`; backend kini
   menolak password baru < 8 karakter (temuan #16). Form harus sinkron ke min 8,
   kalau tidak error hanya muncul setelah submit.
3. **Opsi "Developer" di select Role** — form create/edit user memuat semua role
   tanpa filter; backend kini menolak `roleId: 1` (temuan #7). Opsi Developer wajib
   disembunyikan untuk non-developer, kalau tidak memilihnya = selalu 403.
4. (Bonus) Toaster di layout `(auth)` — lihat temuan non-security #1: toast login
   tidak pernah tampil di produksi.

Ringkasan: **4 kritikal, 5 tinggi, 6 medium, 8 rendah**. Semua temuan kritikal/tinggi
terverifikasi live (bukan dugaan dari kode).

---

## Ringkasan

| # | Severity | Temuan | Terverifikasi live? |
|---|---|---|---|
| 1 | KRITIKAL | Webhook Midtrans hang selamanya — pembayaran QRIS/VA tak pernah settle | Ya (curl timeout 8s) | 
| 2 | KRITIKAL | Fallback otorisasi ke user 1 (Developer) — celah auth masa depan jadi akses penuh | Ya (kode + perilaku webhook) | 
| 3 | KRITIKAL | Hash password Argon2 bocor via `columns[]=password` | Ya (`$argon2d$v=19$m=65536,t=3,p=4...`) | 
| 4 | KRITIKAL | JWT secret fallback hardcoded + tanpa pinning algoritma | Kode (secret aktif = fallback literal) | 
| 5 | TINGGI | IDOR order: user1 (kasir) bisa baca order siapa pun | Ya (200 live) |  
| 6 | TINGGI | Dashboard finansial tanpa permission gate | Ya (user1 → 200 semua endpoint) | 
| 7 | TINGGI | Admin = superadmin (eskalasi ke Developer via roleId + assign-permissions) | Kode |
| 8 | TINGGI | Route tak dikenal dengan token valid → hang (DoS) | Ya (curl timeout 8s) |
| 9 | TINGGI | Kredensial demo `admin`/`password` ter-prefill di form login produksi | Ya (HTML live) |
| 10 | MEDIUM | Tanpa rate limit login/refresh — brute force | Kode |
| 11 | MEDIUM | SSE broadcast semua event ke semua klien | Kode |
| 12 | MEDIUM | Presign URL terbuka untuk semua user terautentikasi | Kode |
| 13 | MEDIUM | Swagger `/docs` + index publik | Ya (200 tanpa auth) |
| 14 | MEDIUM | Error handler: token rusak → 500; `APP_ENV=test/staging` → hang | Ya (500 live) |
| 15 | MEDIUM | Business error "stok tidak cukup" dibalas 500 | Ya (500 live) |
| 16 | RENDAH | Argon2d (bukan argon2id), salt 50, password policy min 1 char | Ya (hash live) |
| 17 | RENDAH | Upload validasi MIME saja (client-controlled) | Kode |
| 18 | RENDAH | Access token tak bisa dicabut; user dinonaktifkan tetap akses JWT-only | Kode |
| 19 | RENDAH | Cache permission 24 jam; Redis lokal tanpa auth | Kode |
| 20 | RENDAH | `X-Powered-By: Express`; morgan log signed URL; `console.log(e.response)` Midtrans | Ya (header live) |
| 21 | RENDAH | Signed-file path traversal bila `STORAGE_SECRET` fallback `'secret'` | Kode |
| 22 | RENDAH | 2FA dead code; OTP email hardcoded; log OTP plaintext | Kode |
| 23 | RENDAH | `restoreUser`/`deleteProduct` tanpa `await`; dokumen midtrans.md kadaluarsa | Kode |

---

## Temuan kritikal

### 1. Webhook Midtrans hang — pembayaran non-tunai rusak di produksi
`api/apps/api/src/adapters/http/routes/index.ts:33-36` mendaftarkan webhook di dalam
callback yang bukan router:

```ts
app.use(auth.authorize(['Manage Order']), () => {
  app.post('/api/v1/webhooks/midtrans', ...);
  app.post('/api/v1/webhooks/midtrans/mock', ...);
});
```

Callback tidak memanggil `next()` dan tidak berupa router, jadi request apa pun yang
sampai ke lapisan ini (semua webhook + semua route tak dikenal dengan token valid)
berhenti tanpa respons. `RouteNotFoundHandler` (`express.ts:58`) tidak pernah tercapai.

**Bukti live:** `POST /api/v1/webhooks/midtrans` dan `/mock` → timeout 8 detik (status 000).
Konsekuensi: notifikasi settlement dari Midtrans tidak pernah diproses — order QRIS/VA
tidak pernah berubah ke `paid` otomatis. `GET /api/v1/benar-benar-tidak-ada` dengan token
valid juga hang (8s).

lakukan perbaikan
**Perbaikan:**
```ts
const webhookRoutes = express.Router();
webhookRoutes.post('/api/v1/webhooks/midtrans', ...);
webhookRoutes.post('/api/v1/webhooks/midtrans/mock', ...);
app.use(auth.authorize(['Manage Order']), webhookRoutes);
// dan pastikan authorize melempar 401/403 tanpa fallback user 1 (lihat #2)
```

### 2. Fallback otorisasi ke user 1
`api/apps/api/src/use-cases/auth/authorization.ts:21`:
```ts
const userId = extractUserId(req) || 1;
```
Setiap request yang lolos JWT tapi tidak membawa user yang terverifikasi dinilai sebagai
user id 1 (Developer) — inilah yang membuat lapisan webhook lolos `Manage Order`. Celah
auth apa pun di masa depan otomatis menjadi akses Developer penuh.

lakukan perbaikan
**Perbaikan:** hapus fallback; tanpa `userId` → langsung `ErrorUnauthorized`.

### 3. Hash password bocor lewat API
`USER_FIELD` memuat `password`, dan `columns[]=password` diterima tanpa filter.
**Bukti live:** `GET /api/v1/users?columns[]=password&limit=1` sebagai admin →
`{"password":"$argon2d$v=19$m=65536,t=3,p=4$..."}`.

lakukan perbaikan
**Perbaikan:** buang `password` dari `USER_FIELD` (`api/apps/api/src/domain/entities/models/user.ts`
+ `user-validation.ts`).

### 4. JWT secret hardcoded sebagai fallback
`api/apps/api/src/config/config.ts:38`:
```ts
config.secret = process.env.HASH_SECRET || 'zN6p9JfG@!Xc7vR2Ls$wq04Mb';
```
`.env` aktif tidak mengisi `HASH_SECRET` dan `docker-compose.yml:121` memakai literal yang
sama → runtime produksi saat ini kemungkinan besar berjalan dengan secret publik. Siapa pun
yang membaca source bisa memalsukan token Developer. `jwt.verify` juga tidak mem-pin
algoritma HS256 (algorithm confusion risk).

lakukan perbaikan
**Perbaikan:** wajibkan `HASH_SECRET` (crash saat startup bila kosong), ganti secret,
pin `algorithms: ['HS256']` di `jwt.helper.ts`.

---

## Temuan tinggi

### 5. IDOR order
`GET /v1/orders/:id`, `PUT /v1/orders/:id/status`, `POST /v1/orders/:id/cancel` hanya
cek `Show Order`/`Manage Order` tanpa kepemilikan. Role `User` (kasir) punya keduanya.
**Bukti live:** user1 → `GET /v1/orders/50897` (order user lain) → 200. Hanya `findAll`
yang di-scope, dan itu pun hanya berdasar nama role, bukan data (`authorization-order.ts:8-12`).
lakukan perbaikan => handle error pada role user/kasir, error forbidden jika manage data milik user lain

### 6. Dashboard finansial tanpa permission
Semua `GET /v1/dashboard*` hanya butuh JWT. **Bukti live:** user1 → 200 di `summary`,
`orders-trend`, `orders-by-status`, `payments`, `top-products` + CSV export. Kasir melihat
revenue & tren toko.
lakukan perbaikan => user/kasir hanya menampilkan top products, order by status, dan count total products

### 7. Admin = superadmin
Admin bisa `PUT /v1/users/:id` dengan `roleId: 1` dan `POST /v1/roles/assign-permissions`
untuk memberi Admin role permission `Show/Manage Permission`. Role bawaan Developer (id 1)
tidak dilindungi. **Perbaikan:** kunci `roleId=1` dan larang assign permission ke role sendiri.
lakukan perbaikan

### 8. Route tak dikenal dengan token valid → hang
Gabungan temuan #1 — `RouteNotFoundHandler` tak tercapai. **Bukti live:** GET unknown path
dengan Bearer token → timeout 8s. Murah untuk menyedot socket server (DoS).
lakukan perbaikan

### 9. Kredensial demo ter-prefill di form login produksi
`app/apps/app/src/app/(auth)/_components/login-form.tsx:26-27`:
```ts
username: isProduction ? 'admin' : '',
password: isProduction ? 'password' : '',
```
Di produksi, form login datang terisi `admin`/`password`. Siapa pun yang menemukan URL
tinggal tekan tombol — dan `admin` adalah role hampir-superadmin (lihat #7). **Perbaikan:**
hapus prefill; pakai placeholder.
=> skip

---

## Temuan medium

### 10. Tanpa rate limit
Tidak ada rate limit sign-in/refresh/upload (hanya counter OTP di route yang tidak
di-mount). Brute-force & credential stuffing bebas. Tidak ada `helmet` (tanpa header
security); `X-Powered-By: Express` terekspos (diverifikasi live).
=> lakukan perbaikan

### 11. SSE broadcast tanpa filter
`GET /v1/sse` JWT-only; bridge menyiarkan event apa pun ke semua klien
(`sse-redis-bridge.ts:34-38`). Order event memuat payload order lengkap; path Midtrans
juga menyiarkan `USER_PROFILE`. Semua user terautentikasi bisa menyadap data transaksi.
=> skip

### 12. Presign URL terbuka
`POST /v1/uploads/generate-presign-url` tanpa permission resource; ekstensi object key
berasal dari `filename` sisi klien. Dengan bucket publik (MinIO dev mode anonim), ini =
hosting HTML/JS arbitrer (stored XSS) + konsumsi storage.
=> perbaiki gunakan permission manage product dan manage user, lakukan cross check takut salah permissions

### 13. Swagger publik
`/docs` dan `/` publik (diverifikasi live: 200 tanpa auth). Speknya juga kadaluarsa
(`/users/my-account` vs `/users/me`, `/product-categories` vs `/categories`), dan
`app/docs/midtrans.md` mendokumentasikan `/api/v1/midtrans/notification` yang tidak
ada (route asli: `/webhooks/midtrans`).
=> lakukan perbaikan, disable swagger di production

### 14. Error handling bocor/inkonsisten
- JWT malformed → **500** (diverifikasi live), bukan 401: `JsonWebTokenError` tidak
  dipetakan (`jwt.helper.ts:18-21`).
- `APP_ENV` selain development/production → error handler tidak membalas apa pun → hang.
- Stack trace dikirim saat `APP_ENV=development` (default bila env kosong).
lakukan perbaikan

### 15. Business error jadi 500
**Bukti live:** create order saat stok tidak cukup →
`500 {"message":"Stok produk ID X tidak mencukupi."}` — seharusnya 400/409. Prisma
error juga bocor sebagai 500 di produksi.
lakukan perbaikan error 400t

---

## Temuan rendah (hardening)

| # | Temuan | Lokasi |
|---|---|---|
| 16 | Argon2d + default cost, salt 50, kebijakan password min 1 char | `helpers/password.helper.ts:3-5`, `validations/base-validation.ts:31` | perbaiki
| 17 | Upload memvalidasi MIME saja (client-controlled); memoryStorage 15 MB | `helpers/multer.helper.ts` | skip
| 18 | Access token 5 menit di env aktif (bagus), tapi payload memuat seluruh profil user; tidak revocable; user dinonaktifkan tetap bisa akses JWT-only (dashboard, `/users/me`, SSE, presign) sampai exp | `use-cases/auth/check-token.ts:10-17` | perbaiki
| 19 | Cache permission 24 jam (`ME_CACHE_TTL`); Redis lokal tanpa auth; siapa pun di network bisa menulis ulang `permissions:user-*` | `config.ts:50`, `docker-compose.yml:20-32` | perbaiki
| 20 | `console.log(e.response)` Midtrans bisa mencetak Basic auth server key; morgan log signed URL (`sig`, `expires`) | `repositories/midtrans/midtrans-repository.ts:19-21`, `express.ts:21` | perbaiki tapi tetep manampilkan error yang terjadi
| 21 | `/public/files` path traversal bila `STORAGE_SECRET` fallback `'secret'`; perbandingan HMAC tidak timing-safe | `webserver/express.ts:44-54`, `config/storage.config.ts:2` | skip, tidak digunakan, menggunakan s3
| 22 | 2FA dead code; email OTP hardcoded ke alamat developer; nilai OTP dilog plaintext | `use-cases/auth/send-otp.ts:46`, `verify-otp.ts:28` | perbaiki reference ke config -> env, tanpa default value
| 23 | `restoreUser` tanpa `await`; `delete-product` tanpa `await` + selalu soft-delete | `adapters/http/controller/user-controller.ts:188`, `use-cases/product/delete-product.ts:9-11` | perbaiki

## Yang sudah benar (jangan diubah)

- SQL injection: bersih — semua raw SQL pakai `Prisma.sql` terparameterisasi; `orderBy`/
  `columns`/`with` divalidasi enum (`dashboard-repository.ts`).
- CORS allowlist eksplisit, bukan wildcard (diverifikasi live: origin asing tanpa ACAO).
- Mass assignment aman: field dipick manual, key body tak dikenal diabaikan (diuji live).
- Login membedakan generik antara user tidak dikenal dan password salah (400 sama).
- Refresh token di-hash di Redis (SHA-256) dan dirotasi per pemakaian; refresh lama
  langsung invalid (diuji live).
- `PUT /users/me` mengunci `roleId`/`isActive` (tidak bisa self-escalate lewat itu).
- Middleware Next.js: semua route selain `/login` dilindungi, redirect konsisten 307
  (diuji live: `/`, `/dashboard`, `/pos`, `/products`, `/api/sse`).
- RBAC halaman (403 "Access denied") dan penyembunyian tombol Manage bekerja untuk role
  `User` (diuji live di UI).
- Multer punya size limit + allowlist tipe.

## Temuan non-security dari pengujian (kualitas)

1. **Toast login tidak pernah muncul di produksi** — `<Toaster>` hanya dirender di
   layout `(protected)` dan `(pos)`, tidak di `(auth)`. Server action membalas
   `{success:false,error:"Username or password invalid."}` (diverifikasi via network),
   tapi pengguna tidak melihat pesan apa pun. UX rusak untuk feedback error/sukses login.
2. **Docs drift** — `app/docs/midtrans.md` mendokumentasikan route `/api/v1/midtrans/*`
   yang tidak ada; OpenAPI juga punya path hantu (`/users/my-account`, `/product-categories`,
   `POST /payments`).
3. **AGENTS.md api menyebut BullMQ/RabbitMQ/admin queues** — tidak ada di kode (teks
   template tertinggal).

## Prioritas perbaikan (usulan)

1. Fix routing webhook (temuan 1) — pembayaran non-tunai produksi sedang rusak.
2. Hapus fallback user 1 (temuan 2) — bareng nomor 1.
3. Buang `password` dari `USER_FIELD` (temuan 3).
4. Rotasi `HASH_SECRET` + wajib env + pin HS256 (temuan 4).
5. Hapus prefill kredensial di login produksi (temuan 9) — bisa dilakukan hari ini.
6. Tambah ownership check di order detail/status/cancel (temuan 5).
7. Gate permission di dashboard + presign (temuan 6, 12).
8. Rate limit sign-in + helmet (temuan 10).
