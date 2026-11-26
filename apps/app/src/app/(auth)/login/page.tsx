import { LoginBrandPanel } from '@/app/(auth)/_components/login-brand-panel';
import { LoginForm } from '@/app/(auth)/_components/login-form';
import { auth } from '@/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { app as config } from '@/config/config';
import { Store } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const sessionExpired = reason === 'expired';
  const session = await auth();

  if (session && !session.error && !sessionExpired) redirect('/dashboard');

  return (
    <div className="grid min-h-svh lg:grid-cols-[46%_54%]">
      <div className="flex flex-col bg-background px-6 py-8 sm:px-10 lg:py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Store className="size-5" />
            </div>
            <span className="text-base font-semibold tracking-tight">{config.name}</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <LoginForm sessionExpired={sessionExpired} />
        </main>
      </div>

      <aside className="hidden lg:block">
        <LoginBrandPanel />
      </aside>
    </div>
  );
}
