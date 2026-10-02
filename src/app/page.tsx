import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const session = await auth();

  if (session) {
    redirect('/users'); // sudah login → langsung ke halaman utama
  }

  redirect('/login'); // belum login → ke halaman login
}
