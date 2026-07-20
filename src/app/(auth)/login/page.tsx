import { auth } from '@/auth';
import { LoginForm } from '@/app/(auth)/_components/login-form';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect('/users');

  return (
    <main className="flex min-h-screen items-center justify-center">
      <LoginForm />
    </main>
  );
}
