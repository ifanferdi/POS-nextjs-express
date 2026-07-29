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

import { Gender } from '@/domain';

export const app = {
  name: process.env.APP_NAME ?? 'Boilerplate Next JS',
  env: process.env.NODE_ENV ?? 'development',
  url: process.env.APP_URL ?? 'http://localhost:3000',
} as const;

export const api = {
  baseUrl: process.env.API_BASE_URL ?? 'http://localhost:8000/api',
} as const;

export const auth = {
  secret: process.env.NEXTAUTH_SECRET ?? '',
  refreshBufferSeconds: Number(process.env.AUTH_REFRESH_BUFFER_SECONDS ?? 60),
} as const;

export const options = {
  genderOptions: [
    { label: 'Male', value: Gender.MALE },
    { label: 'Female', value: Gender.FEMALE },
  ],
  activeOptions: [
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ],
} as const;
