import { AppHeader } from '@/app/(protected)/_components/app-header';
import { AppSidebar } from '@/app/(protected)/_components/app-sidebar';
import { auth } from '@/auth';
import { QueryProvider } from '@/components/query-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect('/login');

  if (session.error === 'RefreshTokenError') redirect('/login?reason=expired');

  return (
    <QueryProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar username={session.user?.username} permissions={session.user?.permissions} />
          <SidebarInset>
            <AppHeader username={session.user?.username} />
            <main className="min-w-0 flex-1 bg-background p-4 sm:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </QueryProvider>
  );
}
