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
    <div className="grid min-h-screen lg:grid-cols-[46%_54%]">
      <div className="relative flex flex-col px-6 py-8 sm:px-10 lg:py-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,var(--color-primary)/8,transparent_60%)]"
          aria-hidden
        />
        <header className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Store className="size-5" />
            </div>
            <span className="text-base font-semibold tracking-tight">{config.name}</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="relative z-10 flex flex-1 items-center justify-center py-10">
          <LoginForm sessionExpired={sessionExpired} />
        </main>
      </div>

      <div className="hidden lg:block">
        <LoginBrandPanel />
      </div>
    </div>
  );
}
