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
import { LogOut, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';

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

export function TopBar({ isPosPage, username }: { isPosPage: boolean; username?: string }) {
  const [isPending, startTransition] = useTransition();
  const initials = username ? username.slice(0, 2).toUpperCase() : 'AD';
  username = username ?? 'Admin';
  isPosPage = isPosPage;

  const handleLogout = () => startTransition(async () => await logoutAction());

  return (
    <div className="ml-auto flex items-center h-12 py-1">
      {!isPosPage && (
        <Button asChild variant="default" size="sm" className="gap-2 mr-3 h-10">
          <Link href="/pos">
            <ShoppingCart className="size-4" />
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
            <span className="hidden text-sm font-medium sm:inline">{username}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{username}</span>
              <span className="text-xs font-normal text-muted-foreground">Signed in</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={handleLogout}
            disabled={isPending}
            className="cursor-pointer"
          >
            <LogOut />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
