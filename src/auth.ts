import { config } from '@/config/config';
import { loginRequest, refreshTokenRequest } from '@/features/auth/api';
import { RefreshTokenResponseDto } from '@/features/auth/dto';
import { LoginSchema } from '@/features/auth/schema';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

/**
 * Generic: fungsi refresh token, bisa dipakai project lain
 * yang punya backend dengan mekanisme refresh token serupa.
 */
async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponseDto> {
  return await refreshTokenRequest(refreshToken);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt', // wajib untuk Credentials Provider — lihat dokumentasi resmi
  },

  providers: [
    Credentials({
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
          console.log(error);
          // authorize() return null → NextAuth tampilkan error di halaman login
          // Lihat: https://authjs.dev/getting-started/authentication/credentials
          return null;
        }
      },
    }),
  ],

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
        token.accessTokenExpiry = user.tokenExpiry;
        return token;
      }

      // Request berikutnya — cek proaktif apakah token perlu di-refresh
      const bufferMs = config.auth.refreshBufferSeconds * 1000;
      const isExpiringSoon = Date.now() > token.accessTokenExpiry - bufferMs;

      if (!isExpiringSoon) {
        return token; // token masih fresh, gak perlu refresh
      }

      try {
        const refreshed = await refreshAccessToken(token.refreshToken);
        // const myAccount = await getMyAccountRequest(refreshed.token, {
        //   with: [UserRelation.PROFILE, UserRelation.ROLE_PERMISSIONS],
        // });

        token.accessToken = refreshed.token;
        token.refreshToken = refreshed.refreshToken;
        token.accessTokenExpiry = refreshed.tokenExpiry;
        // token.role = myAccount.role; // ← role terbaru dari backend
        // token.permissions = myAccount.permissions; // ← permissions terbaru dari backend

        return token;
      } catch (error) {
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
      session.user.id = token.sub as string;
      return session;
    },
  },

  pages: { signIn: '/login' },
});
