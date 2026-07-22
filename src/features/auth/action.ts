'use server';

import { signIn, signOut } from '@/auth';
import { LoginSchema } from '@/features/auth/schema';
import { AuthError } from 'next-auth';

export interface LoginActionResult {
  success: boolean;
  error?: string;
}

export async function loginAction(value: unknown): Promise<LoginActionResult> {
  // validasi input di server
  const parsed = LoginSchema.parse(value);
  if (!parsed) return { success: false, error: 'Login input invalid' };

  try {
    await signIn('credentials', {
      username: parsed.username,
      password: parsed.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError)
      switch (error.type) {
        case 'CredentialsSignin':
          return { success: false, error: 'Username or password invalid.' };
        default:
          return { success: false, error: 'Something went wrong. Try again.' };
      }

    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}
