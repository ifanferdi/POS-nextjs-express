import { auth } from '@/auth';
import { api as configApi } from '@/config/config';
import axios from 'axios';
import { redirect } from 'next/navigation';

/**
 * Buat Axios instance yang sudah inject accessToken dari session NextAuth.
 *
 * ATURAN PAKAI:
 * ✅ Server Component   — `const api = await createServerApiClient()`
 * ✅ Server Action      — `const api = await createServerApiClient()`
 * ❌ Client Component   — JANGAN dipakai, fungsi ini hanya jalan di server
 *
 * GENERIC: fungsi ini tidak terikat ke domain tertentu (bukan DigiPro-specific),
 * bisa dipakai ulang di project lain yang punya backend dengan Bearer token auth.
 */

export async function createServerApiClient() {
  const session = await auth();
  const instance = axios.create({
    baseURL: configApi.baseUrl,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken && { Authorization: `Bearer ${session.accessToken.trim()}` }),
    },
    timeout: 30_000,
  });

  /**
   * Response interceptor — handle error dari backend secara terpusat.
   * Biar tiap queries.ts / action.ts gak perlu nulis error handling yang sama.
   */
  instance.interceptors.response.use(
    (response) => response,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (error: Record<string, any>) => {
      // JWT expired — redirect ke login (refresh token juga sudah expired/fail)
      if (error.response?.data?.message === 'jwt expired') redirect('/login');

      if (error.response?.status === 401) throw new Error('UNAUTHORIZED');
      if (error.response?.status === 403) throw new Error('FORBIDDEN');
      if (error.response?.status === 404) throw new Error('NOT FOUND');

      // Error lain - lempang kembali dengan message dari backend kalau ada
      const message =
        (error.response?.data as { message?: string })?.message ??
        error.message ??
        'INTERNAL_SERVER_ERROR';

      // throw new Error(message);
    },
  );

  return instance;
}
