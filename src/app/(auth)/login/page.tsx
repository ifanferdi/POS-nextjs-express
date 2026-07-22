import { LoginBrandPanel } from '@/app/(auth)/_components/login-brand-panel';
import { LoginForm } from '@/app/(auth)/_components/login-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect('/users');

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:block">
        <LoginBrandPanel />
      </div>
      <div className="relative flex items-center justify-center p-6">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
