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

import {
  BoxesIcon,
  BoxIcon,
  KeyRoundIcon,
  ShieldUserIcon,
  ShoppingCartIcon,
  UserRoundCheckIcon,
  UsersIcon,
} from 'lucide-react';

export const app = {
  name: process.env.APP_NAME ?? 'POS Apps',
  description: process.env.APP_SUBTITLE ?? 'Point Of Sale Apps',
  env: process.env.NODE_ENV ?? 'development',
  url: process.env.APP_URL ?? 'http://localhost:3000',
};

export const company = {
  name: process.env.COMPANY_NAME ?? 'POS App',
  address:
    process.env.COMPANY_ADDRESS ?? 'Jl. H. Dimun 4 No.1, Rt. 02/06, Sukamaju, Cilodong, Depok',
};

export const api = {
  baseUrl: process.env.API_BASE_URL ?? 'http://localhost:8000/api',
};

export const auth = {
  secret: process.env.NEXTAUTH_SECRET ?? '',
  refreshBufferSeconds: Number(process.env.AUTH_REFRESH_BUFFER_SECONDS ?? 60),
};

export const options = {
  activeOptions: [
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ],
};

export const icons = {
  user: UsersIcon,
  role: ShieldUserIcon,
  permission: KeyRoundIcon,
  product: BoxIcon,
  isActive: UserRoundCheckIcon,
  category: BoxesIcon,
  order: ShoppingCartIcon,
};
