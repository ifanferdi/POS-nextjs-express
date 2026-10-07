import { auth } from '@/auth';
import { NextResponse } from 'next/server';

const publicRoutes = ['/login'];
const authRoutes = ['/login'];

// ponytail: pakai wrapper `auth(...)`, bukan `auth()` biasa — supaya Set-Cookie
// dari refresh token ikut dikirim balik (kalau tidak, tokenExpiry tidak pernah tersimpan).
export default auth((req) => {
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
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
