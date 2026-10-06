import { auth as authConfig } from '@/config/config';
import { getMe, loginRequest, refreshTokenRequest } from '@/features/auth/api';
import { RefreshTokenResponseDto } from '@/features/auth/dto';
import { LoginSchema } from '@/features/auth/schema';
import axios from 'axios';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { redirect } from 'next/navigation';
import { cache } from 'react';

/**
 * Dedupe fetch /me per page request (Server Component + Server Action
 * dalam satu render berbagi hasil yang sama).
 */
const getMeCached = cache((accessToken: string) => getMe(accessToken));

/**
 * Generic: fungsi refresh token, bisa dipakai project lain
 * yang punya backend dengan mekanisme refresh token serupa.
 */
async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
  return await refreshTokenRequest(refreshToken);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [handleSignIn()],
  callbacks: {
    /**
     * Dipanggil setiap session diakses.
     * `user` HANYA ada saat baru sign in (bukan di request berikutnya).
     */
    async jwt({ token, user }) {
      // Sign in pertama kali — isi token dari hasil authorize()
      if (user) {
        token.id = user.id;
        token.accessToken = user.token;
        token.refreshToken = user.refreshToken;
        token.tokenExpiry = user.exp;
        token.user = user.user;
        token.error = undefined;

        return token;
      }

      // Request berikutnya — cek proaktif apakah token perlu di-refresh
      const bufferMs = authConfig.refreshBufferSeconds * 1000;
      const tokenExpiry = token.tokenExpiry;
      // tokenExpiry undefined (cookie lama) → paksa refresh
      const isExpiringSoon = !tokenExpiry || Date.now() > tokenExpiry * 1000 - bufferMs;

      if (!isExpiringSoon) {
        return token; // token masih fresh, gak perlu refresh
      }

      try {
        const refreshed = await refreshAccessToken(token.refreshToken);

        token.id = refreshed.user.id;
        token.accessToken = refreshed.token;
        token.refreshToken = refreshed.refreshToken;
        token.tokenExpiry = refreshed.exp;
        token.user = refreshed.user;
        token.error = undefined;

        return token;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // console.log('refresh token');
          // console.log({ status: error.response?.status, ...error.response?.data });
        }

        // Refresh gagal (refresh token expired/invalid) → tandai token error
        // Bisa dicek di Server Component untuk force redirect ke /login
        return { ...token, error: 'RefreshTokenError' };
      }
    },

    /**
     * Dipanggil setelah jwt() — bentuk akhir yang diterima oleh auth()
     * di Server Component.
     */
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.tokenExpiry = token.tokenExpiry;
      session.error = token.error; // propagate RefreshTokenError ke session
      session.user.id = token.sub ?? '';
      session.user.username = token.user?.username ?? '';
      session.user.name = token.user?.profile?.fullName ?? token.user?.username ?? '';

      try {
        const me = await getMeCached(token.accessToken);
        session.user.role = me.role;
        session.user.permissions = me.permissions;
        session.user.name = me.profile?.fullName ?? me.username;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          // Auth.js menelan throw NEXT_REDIRECT ini (session action punya try/catch),
          // sehingga session jadi null + cookie dibersihkan; layout tetap redirect /login.
          if (status === 401 || status === 404) redirect('/login');
        }
        throw error; // 500 / network error → biarkan error boundary tangani
      }

      return session;
    },
  },

  pages: { signIn: '/login' },
});

function handleSignIn(): import('@auth/core/providers').Provider {
  return Credentials({
    name: 'Credentials',
    credentials: {
      username: { label: 'Username', type: 'text' },
      password: { label: 'Password', type: 'password' },
    },

    async authorize(credentials) {
      try {
        const { username, password } = LoginSchema.parse(credentials);

        // Objek ini yang akan masuk ke parameter `user` di callback jwt()
        const login = await loginRequest(username, password);

        return login;
      } catch (error) {
        if (axios.isAxiosError(error))
          console.log({ status: error.response?.status, ...error.response?.data });
        // authorize() return null → NextAuth tampilkan error di halaman login
        // Lihat: https://authjs.dev/getting-started/authentication/credentials
        return null;
      }
    },
  });
}
