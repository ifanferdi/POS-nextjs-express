import { auth } from '@/auth';
import { TopBar } from '@/components/shared/top-bar';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { app } from '@/config/config';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import React from 'react';
import { Toaster } from 'sonner';

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect('/login');
  if (session.error === 'RefreshTokenError') redirect('/login?reason=expired');

  const username = session.user?.username ?? 'Cashier';

  return (
    <TooltipProvider>
      <div className="flex h-dvh min-h-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-3 print:hidden">
          <Button variant="ghost" size="sm" asChild className="gap-2 h-full">
            <Link href="/dashboard" aria-label="Back to Dashboard">
              <ArrowLeftIcon className="size-4" />
              <span className="hidden text-sm font-medium sm:inline">Dashboard</span>
            </Link>
          </Button>
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-tight">
            {app.name}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <TopBar isPosPage={true} username={username} />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-hidden bg-background">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </TooltipProvider>
  );
}
