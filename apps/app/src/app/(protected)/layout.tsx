import { AppHeader } from '@/app/(protected)/_components/app-header';
import { AppSidebar } from '@/app/(protected)/_components/app-sidebar';
import { auth } from '@/auth';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) redirect('/login');

  if (session.error === 'RefreshTokenError') redirect('/login?reason=expired');

  return (
    <SidebarProvider>
      <AppSidebar username={session.user?.username} permissions={session.user?.permissions} />
      <SidebarInset>
        <AppHeader username={session.user?.username} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <TooltipProvider>{children}</TooltipProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
