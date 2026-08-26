import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { app } from '@/config/config';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';
import { TopBar } from '../(protected)/_components/app-header';

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || session.error === 'RefreshTokenError') redirect('/login');

  const username = session.user?.username ?? 'Cashier';

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b px-3 py-2 backdrop-blur-sm print:hidden">
        <Button variant="ghost" size="sm" asChild className="gap-2 h-full">
          <Link href="/orders" aria-label="Back to Admin Panel">
            <ArrowLeftIcon className="size-4" />
            <span className="hidden text-sm font-medium sm:inline">Admin Panel</span>
          </Link>
        </Button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-tight">
          {app.name}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <TopBar isPosPage={true} username={username} />
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
