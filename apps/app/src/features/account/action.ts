'use server';

import { auth, getMeCached } from '@/auth';
import { ActionResult } from '@/domain';
import { updateAccount } from '@/features/account/api';
import {
  AccountProfileInput,
  AccountProfileSchema,
  ChangePasswordInput,
  ChangePasswordSchema,
} from '@/features/account/schema';
import { getMe } from '@/features/auth/api';
import { stringSchema } from '@/lib/base.schema';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

export async function updateMyAccountAction(
  input: AccountProfileInput,
): Promise<ActionResult<null>> {
  const validate = AccountProfileSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  try {
    await updateAccount({
      username: validate.data.username,
      profile: {
        ...validate.data.profile,
        imagePath: validate.data.profile.imagePath ?? undefined,
      },
    });

    revalidatePath('/account');
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update account.',
    };
  }
}
export async function refreshMyProfileImageUrlAction(): Promise<string | null> {
  const session = await auth();
  if (!session?.accessToken) return null;

  const me = await getMe(session.accessToken);
  return me.profile?.imagePath?.startsWith('profiles/') ? (me.profile.imageUrl ?? null) : null;
}

export async function changeMyPasswordAction(
  input: ChangePasswordInput,
): Promise<ActionResult<null>> {
  const validate = ChangePasswordSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  try {
    const session = await auth();
    if (!session?.accessToken) return { success: false, error: 'Unauthorized.' };
    const me = await getMeCached(session.accessToken);

    await updateAccount({
      username: stringSchema.parse(me.username),
      oldPassword: validate.data.oldPassword,
      password: validate.data.password,
      confirmPassword: validate.data.confirmPassword,
    });

    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change password.',
    };
  }
}
