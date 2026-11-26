import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const session = await auth();

  if (!session) redirect('/login'); // belum login → ke halaman login

  // sudah login → arahkan sesuai role
  redirect(session.user.role.name === 'User' ? '/pos' : '/dashboard');
}
