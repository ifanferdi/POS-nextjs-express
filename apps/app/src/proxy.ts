import { auth } from '@/auth';
import type { NextAuthRequest } from 'next-auth';
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server';

const publicRoutes = ['/login'];
const authRoutes = ['/login'];

type AuthProxy = (req: NextAuthRequest, event: NextFetchEvent) => Response | Promise<Response>;

// Wrapper `auth(...)`, bukan `auth()` biasa — supaya Set-Cookie dari refresh token
// ikut dikirim balik (kalau tidak, tokenExpiry tidak pernah tersimpan).
const handler: AuthProxy = (req) => {
  const session = req.auth;

  const isExpired = !!session?.tokenExpiry && session.tokenExpiry * 1000 < Date.now();
  const isLoggedIn = !!session && !session.error && !isExpired;
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(req.nextUrl.pathname);

  // sudah login (token valid) tapi akses /login -> redirect ke /users
  if (isAuthRoute && isLoggedIn) return NextResponse.redirect(new URL('/users', req.nextUrl));

  if (!isPublicRoute && !isLoggedIn)
    return NextResponse.redirect(
      new URL(isExpired ? '/login?reason=expired' : '/login', req.nextUrl),
    );

  return NextResponse.next();
};

const authProxy = auth(handler);

/**
 * Middleware refresh token tepat saat `tokenExpiry` lewat, lalu cookie barunya
 * juga diteruskan ke request ini. Tanpa ini RSC / Server Action di request yang
 * sama masih membaca cookie lama dan me-refresh ulang — kalau backend merotasi
 * refresh token, refresh kedua gagal dan request berakhir 401.
 */
export default async function proxy(req: NextRequest, event: NextFetchEvent) {
  const response = await authProxy(req, event);

  // redirect / rewrite: cookie hasil refresh sudah menempel di response
  if (!response || response.status !== 200) return response;

  const refreshed = response.headers.getSetCookie();
  if (refreshed.length === 0) return response;

  // Ganti cookie sesi lama (nama sama), jangan append — parser mengambil yang pertama.
  const cookieJar = new Map(req.cookies.getAll().map((cookie) => [cookie.name, cookie.value]));
  for (const raw of refreshed) {
    const [pair] = raw.split(';');
    const separator = pair.indexOf('=');
    cookieJar.set(pair.slice(0, separator), pair.slice(separator + 1));
  }

  const headers = new Headers(req.headers);
  headers.set('cookie', [...cookieJar].map(([name, value]) => `${name}=${value}`).join('; '));

  const next = NextResponse.next({ request: { headers } });
  for (const raw of refreshed) next.headers.append('set-cookie', raw);
  return next;
}

export const config = {
  // `api/auth` tetap dikecualikan agar tidak bentrok dengan handler Auth.js.
  matcher: ['/((?!api/auth|_next/static|_next/image|.*\\.png$).*)'],
};
