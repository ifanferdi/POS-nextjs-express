'use client';

import { TopBar } from '@/components/shared/top-bar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

export function AppHeader({ username }: { username?: string }) {
  const pathname = usePathname();
  const isPosPage = pathname === '/pos';

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b px-3 py-2 backdrop-blur-sm">
      {!isPosPage && <SidebarTrigger />}
      <TopBar isPosPage={isPosPage} username={username} />
    </header>
  );
}
