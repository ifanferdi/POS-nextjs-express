import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { app } from '@/config/config';
import { auth } from '@/auth';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || session.error === 'RefreshTokenError') redirect('/login');

  const username = session.user?.username ?? 'Cashier';

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-sm print:hidden">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/orders" aria-label="Back to Admin Panel">
            <ArrowLeftIcon className="size-4" />
            <span className="hidden text-sm font-medium sm:inline">Admin Panel</span>
          </Link>
        </Button>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-tight">
          {app.name}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-sm font-medium sm:inline">{username}</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}