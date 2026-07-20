/**
 * Centralized application config.
 * Semua akses environment variable HARUS lewat file ini,
 * jangan panggil `process.env.XXX` langsung di tempat lain.
 *
 * Tujuan:
 * 1. Single source of truth untuk default value
 * 2. Type-safe — TypeScript tahu bentuk config ini
 * 3. Reusable — kalau dipakai project lain, cukup ganti .env, config.ts tetap sama
 */

export const config = {
  app: {
    name: process.env.APP_NAME ?? 'Boilerplate Next JS',
    env: process.env.NODE_ENV ?? 'development',
    url: process.env.APP_URL ?? 'http://localhost:3000',
  },

  api: {
    baseUrl: process.env.API_BASE_URL ?? 'http://localhost:8000/api',
  },

  auth: {
    secret: process.env.NEXTAUTH_SECRET ?? '',
    // Berapa lama sebelum expiry access token dianggap "perlu di-refresh" (dalam detik)
    // Beri buffer biar refresh terjadi SEBELUM token benar-benar expired
    refreshBufferSeconds: Number(process.env.AUTH_REFRESH_BUFFER_SECONDS ?? 60),
  },
} as const;
