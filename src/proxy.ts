import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = ['/login'];
const authRoutes = ['/login'];

export default async function proxy(req: NextRequest) {
  const session = await auth(); // ← panggil auth() langsung

  const isLoggedIn = !!session;
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(req.nextUrl.pathname);

  // jika sudah login tapi akses /login -> redirect ke /users
  if (isAuthRoute && isLoggedIn) return NextResponse.redirect(new URL('/users', req.nextUrl)); // ganti route dasbor atau /

  if (!isPublicRoute && !isLoggedIn) return NextResponse.redirect(new URL('/login', req.nextUrl));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
