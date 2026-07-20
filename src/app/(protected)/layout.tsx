import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Secondary check — kalau middleware kelewat, layout ini yang nangkep
  if (!session) redirect('/login');

  // Kalau refresh token error (diset di jwt() callback)
  if ((session as any).error === 'RefreshTokenError') {
    redirect('/login');
  }

  return <>{children}</>;
}
