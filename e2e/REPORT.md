# Laporan E2E Testing & Security Audit — POS App + API

Tanggal: 2026-11-09 · Status akhir: **68/68 test lulus** (37 UI + 31 API), exit code 0.

## Target yang diuji (deploy version)

| Komponen | URL | Teknologi |
|---|---|---|
| App (frontend) | https://pos-app-ifan.vercel.app | Next.js 16, next-auth v5, BFF server actions |
| API (backend) | https://pos-ifan.duckdns.org/api | Express + Prisma + Redis (VPS via Caddy) |

Kredensial seed produksi yang dipakai: `admin`/`password`, `user1`/`password`
(kedua-duanya valid di produksi; form login produksi bahkan sudah ter-prefill
`admin`/`password` — lihat temuan #9 di audit).

## Hasil test

| Suite | File | Hasil |
|---|---|---|
| UI · auth | `tests/ui/01-auth.spec.ts` | 10/10 — redirect tanpa session (307), login gagal/sukses, redirect role, logout, notice sesi kedaluwarsa |
| UI · navigasi | `tests/ui/02-navigation.spec.ts` | 10/10 — semua link sidebar, POS button, avatar menu, halaman 404 |
| UI · konten halaman | `tests/ui/03-pages.spec.ts` | 7/7 — dashboard KPI + filter + **export CSV terunduh**, categories/products/orders/users/discounts/account |
| UI · POS kasir | `tests/ui/04-pos.spec.ts` | 2/2 — shell POS + **checkout tunai end-to-end sampai struk & order muncul di history** |
| UI · RBAC/security | `tests/ui/05-security-ui.spec.ts` | 6/6 — halaman 403, tombol Manage tersembunyi untuk kasir, SSE proxy (unauthenticated 307, authed 200 stream) |
| UI · CRUD kategori | `tests/ui/06-crud-category.spec.ts` | 2/2 — create → search → edit → delete (diverifikasi 404 via API) |
| API · auth | `tests/api/01-auth-api.spec.ts` | 7/7 — sign-in, kredensial salah, 401 tanpa token, prefix `bearer` ditolak, token rusak → **500 (bug)**, refresh rotasi, sign-out |
| API · RBAC matrix | `tests/api/02-rbac-api.spec.ts` | 6/6 — 403 admin di permissions, 403 user1 di users/roles/permissions/payments, **dashboard tanpa gate**, **IDOR order terverifikasi** |
| API · validasi | `tests/api/03-validation-api.spec.ts` | 6/6 — 400 berbagai kasus, Idempotency-Key wajib, check-quota envelope anomali, mass assignment aman |
| API · security probes | `tests/api/04-security-api.spec.ts` | 6/6 — **hash Argon2 bocor**, swagger publik, CORS benar, X-Powered-By, route unknown hang, webhook hang |
| API · CRUD | `tests/api/05-crud-api.spec.ts` | 4/4 — kategori (hard delete), produk (soft), user (soft), order cash **idempotent** + cancel |

Total: **68 passed, 0 failed, 0 skipped, 0 flaky** pada run final (5.0 menit).
Run sebelumnya: 2 test gagal pada iterasi pertama yang kini hijau (perbaikan
selector, bukan perubahan aplikasi).

## Data yang dibuat di produksi selama pengujian

| Data | Status |
|---|---|
| Order UI `INV-261109-0004` (cash, 1 item) | Sengaja tidak dibatalkan — bukti alur UI end-to-end; bisa dihapus manual |
| Order API `INV-261109-0008` + idempotent repeat | Dibersihkan (cancel → refund) |
| Order API `INV-261109-0007` (probe) | Dibersihkan (cancel) |
| Kategori/produk/user dari test & probe (id 1, 24, 103–105, 50001–50003) | Dibersihkan via API (hard/soft delete) |
| Sesi login test di Redis | 30 hari TTL, menumpuk tapi tidak berdampak |

## Temuan utama

Detail + bukti lengkap: **`security-audit.md`** (4 kritikal, 5 tinggi, 6 medium,
8 rendah — semua kritikal/tinggi terverifikasi live di produksi, bukan dugaan).

Yang paling mendesak:

1. **Webhook Midtrans hang selamanya di produksi** — order QRIS/VA tidak akan
   pernah settle otomatis (routing bug di `routes/index.ts:33-36`).
2. **Fallback otorisasi ke user 1 (Developer)** di `authorization.ts:21` —
   celah auth masa depan = akses penuh.
3. **Hash password Argon2 bocor** via `GET /v1/users?columns[]=password`.
4. **JWT secret fallback hardcoded** + tanpa pinning HS256.
5. **IDOR order** + **dashboard finansial tanpa permission** — kasir melihat
   data semua orang (keduanya diverifikasi live).
6. **Kredensial `admin`/`password` ter-prefill di form login produksi.**
7. Bug UX: **toast error login tidak pernah tampil** (Toaster tidak dirender di
   layout `(auth)`).
8. Business error "stok tidak cukup" dibalas **500**, bukan 4xx.

## Cara menjalankan ulang

```bash
cd e2e
npm i -D @playwright/test && npx playwright install chromium
npx playwright test                      # UI + API (5 menit, serial)
npx playwright test --project=ui         # hanya UI
npx playwright test --project=api        # hanya API
npx playwright show-report               # laporan HTML + trace kegagalan
```

Env opsional: `E2E_APP_URL`, `E2E_API_URL`, `E2E_USERNAME`, `E2E_PASSWORD`.

## Batasan yang diketahui

- Test berjalan serial terhadap backend produksi bersama — data berubah
  bersamaan oleh pengguna lain bisa membuat asersi jumlah berubah.
- Test POS checkout membuat 1 order tunai sungguhan tiap run (dilaporkan di log).
- IDOR/dashboard/hash-leak adalah **verifikasi temuan**, diuji sebagai asersi
  perilaku aktual dengan anotasi `finding` — artinya test tetap hijau walau
  perilakunya bug; perbaikan aplikasi akan membuat beberapa test perlu
  diperbarui menjadi asersi "ditolak".
- `APP_ENV` produksi diasumsikan `production`; perilaku error handler berubah
  di env lain.
