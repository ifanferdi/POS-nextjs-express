# User Role Management — Next.js Boilerplate

Boilerplate Next.js (App Router) untuk aplikasi dengan autentikasi, refresh token proaktif, dan RBAC (Role-Based Access Control). Didesain agar mudah dipakai ulang sebagai starter project lain — bagian generic (auth mechanism) dipisah dari bagian project-specific (RBAC fields).

## Stack

| Kategori | Library |
|---|---|
| Framework | Next.js (App Router, Turbopack) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS + shadcn/ui (preset Nova, base Radix) |
| Auth | NextAuth v5 (`5.0.0-beta.31`, Credentials Provider) |
| Form & Validasi | React Hook Form + Zod |
| Data fetching (client) | TanStack Query — dipakai terbatas, untuk skenario interaktif (search/filter/pagination) |
| State management | Zustand — khusus UI state (modal, sidebar), BUKAN untuk token/session |
| HTTP client | Axios — dipakai di server-side (auth callback, refresh token) |
| Package manager | Bun |

## Filosofi Arsitektur

1. **Server Component first** — semua operasi *read* (GET) dilakukan di Server Component. Request ke backend terjadi server-to-server, sehingga endpoint, header, dan token **tidak terlihat** di Network tab browser.
2. **Server Actions untuk mutasi** — operasi Create/Update/Delete memakai Server Actions (`'use server'`), tetap hidden dari client, tanpa perlu bikin API route terpisah.
3. **Token tidak pernah ada di browser** — access token & refresh token disimpan di dalam JWT session NextAuth, terenkripsi dalam cookie httpOnly. Tidak ada token di localStorage maupun di state Zustand.
4. **Refresh token proaktif** — dicek di callback `jwt()` NextAuth setiap session diakses, sebelum token dipakai, bukan reaktif menunggu response 401.

## Struktur Folder

```
src/
├── app/                                  # Routing (App Router)
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx                 # Server Component — render form login
│   ├── (protected)/
│   │   ├── layout.tsx                   # Server Component — cek session, redirect ke /login kalau belum auth
│   │   ├── users/
│   │   │   ├── page.tsx                 # Server Component — fetch list user
│   │   │   └── [id]/
│   │   │       └── page.tsx             # Server Component — fetch detail user
│   │   ├── roles/
│   │   │   └── page.tsx
│   │   └── permissions/
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts             # NextAuth handler — re-export dari src/auth.ts
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Landing — redirect ke /users atau /login
│
├── features/                            # Feature-based modules (mirip module scoping di NestJS)
│   ├── auth/
│   │   ├── dto/
│   │   │   └── login-response.dto.ts      # bentuk response dari POST /auth/login & /auth/refresh-token
│   │   ├── actions/
│   │   │   └── login.action.ts          # Server Action — panggil signIn()
│   │   ├── lib/
│   │   │   └── auth.config.ts           # Config Credentials Provider + JWT callback (refresh logic)
│   │   └── components/
│   │       └── login-form.tsx           # 'use client' — RHF + Zod
│   │
│   ├── users/
│   │   ├── dto/                         # dto users feature 
│   │   ├── actions/                     # create-user.action.ts, update-user.action.ts, delete-user.action.ts
│   │   ├── lib/                         # user.queries.ts — fetch function untuk Server Component
│   │   ├── schemas/                     # user.schema.ts — Zod schema
│   │   ├── types/                       # user.types.ts — tipe domain User
│   │   └── components/                 # user-table.tsx, user-form-dialog.tsx
│   │
│   ├── roles/                           # struktur identik dengan users/
│   └── permissions/                     # struktur identik dengan users/
│
├── components/
│   ├── ui/                              # shadcn/ui components (Button, Dialog, Table, dll)
│   └── shared/
│       ├── require-permission.tsx       # Component show/hide berdasarkan permission user
│       └── app-sidebar.tsx
│
├── lib/
│   └── utils.ts                         # cn() dari shadcn, helper umum
│
├── stores/
│   └── ui-store.ts                      # Zustand — HANYA UI state, bukan token/session
│
├── config/
│   └── config.ts                       # Resolusi terpusat dari environment variable
│
├── types/
│   └── next-auth.d.ts                  # Module augmentation untuk Session & JWT NextAuth
│
└── auth.ts                              # Root NextAuth config — export { auth, signIn, signOut, handlers }
```

## Penamaan File (Konvensi)

| Suffix | Arti | Dijalankan di |
|---|---|---|
| `.action.ts` | Server Action | Server (dipanggil dari Client Component via `<form action={...}>` atau event handler) |
| `.queries.ts` | Fetch function untuk data read | Server (dipanggil dari Server Component) |
| `.schema.ts` | Zod schema validasi | Bisa dipakai di server (Server Action) maupun client (React Hook Form resolver) |
| `.types.ts` | Tipe TypeScript domain-specific | Universal |
| `.d.ts` | Module augmentation / global declaration | Tidak pernah di-import manual, otomatis terbaca TypeScript |

## Generic vs Project-Specific

Karena boilerplate ini dimaksudkan untuk dipakai ulang, beberapa bagian sengaja dipisah:

| Bagian | Sifat | Catatan |
|---|---|---|
| Refresh token mechanism (`jwt()` callback) | **Generic** | Bisa dipakai project lain tanpa modifikasi besar |
| Server Component / Server Action pattern | **Generic** | Arsitektur dasar, tidak terikat domain |
| Field `role`, `permissions` di session (`next-auth.d.ts`) | **Project-specific** | Khusus kebutuhan RBAC, bisa dihapus/disesuaikan untuk project tanpa RBAC |
| Feature `users/roles/permissions` | **Reference implementation** | Contoh pola untuk ditiru saat menambah feature baru (misal `products`, `orders`) |

## Setup

```bash
# 1. Install dependencies
bun install

# 2. Copy environment variables
cp .env.example .env

# 3. Generate NEXTAUTH_SECRET
openssl rand -base64 32
# Paste hasilnya ke NEXTAUTH_SECRET di .env

# 4. Jalankan development server
bun run dev
```

Buka `http://localhost:3000`.

## Environment Variables

Lihat `.env.example` untuk daftar lengkap. Variable wajib diisi:

- `NEXTAUTH_SECRET` — secret untuk enkripsi JWT session, **wajib** ada isinya
- `API_BASE_URL` — URL backend Express yang menjadi sumber data

## Menambah Feature Baru

Ikuti pola yang sudah ada di `features/users/`:

1. Buat folder `features/<nama-feature>/` dengan subfolder: `actions`, `lib`, `schemas`, `types`, `components`
2. Definisikan Zod schema di `schemas/`
3. Tulis fetch function (untuk Server Component) di `lib/`
4. Tulis Server Action (untuk mutasi) di `actions/`
5. Buat halaman di `app/(protected)/<nama-feature>/page.tsx`, panggil fetch function dari `lib/`