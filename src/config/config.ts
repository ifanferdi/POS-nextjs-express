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
  LayoutDashboardIcon,
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
  dashboard: LayoutDashboardIcon,
  user: UsersIcon,
  role: ShieldUserIcon,
  permission: KeyRoundIcon,
  product: BoxIcon,
  isActive: UserRoundCheckIcon,
  category: BoxesIcon,
  order: ShoppingCartIcon,
};

export const files = {
  defaultMaxSize: 15 * 1024 * 1024, // 10MB
  image: {
    types: ['image/png', 'image/jpeg', 'image/jpg'],
    enum: ['image/png', 'image/jpeg', 'image/jpg'] as const,
    size: 15 * 1024 * 1024, // 15MB
  },
  video: {
    types: ['video/mp4'],
    enum: ['video/mp4'] as const,
    size: 50 * 1024 * 1024, // 50MB
  },
  pdf: {
    types: ['application/pdf'],
    enum: ['application/pdf'] as const,
    size: 15 * 1024 * 1024, // 15MB
  },
  ppt: {
    types: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    enum: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'] as const,
    size: 15 * 1024 * 1024, // 15MB
  },
};

export const midtrans = {
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? '',
  snapUrl:
    process.env.NEXT_PUBLIC_MIDTRANS_ENV === 'production'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js',
};

export const sse = { allowedChannels: ['products', 'users', 'orders', 'pos'] as const };
export type SseType = (typeof sse.allowedChannels)[number];
