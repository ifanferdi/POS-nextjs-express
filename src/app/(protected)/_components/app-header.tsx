'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { logoutAction } from '@/features/auth/action';
import { CalculatorIcon, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';

export function AppHeader({ username }: { username?: string }) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const isPosPage = pathname === '/pos';

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  const initials = username ? username.slice(0, 2).toUpperCase() : 'AD';
  const displayName = username ?? 'Admin';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-sm">
      {!isPosPage && <SidebarTrigger />}
      <div className="ml-auto flex items-center gap-1.5 h-full">
        {!isPosPage && (
          <Button asChild variant="default" size="sm" className="gap-2">
            <Link href="/pos">
              <CalculatorIcon className="size-4" />
              <span className="hidden sm:inline">POS</span>
            </Link>
          </Button>
        )}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-full">
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs font-normal text-muted-foreground">Signed in</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout} disabled={isPending}>
              <LogOut />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
