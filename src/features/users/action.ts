'use server';

import { ActionResult } from '@/domain';
import { User } from '@/domain/user.types';
import * as api from '@/features/users/api';
import {
  CreateUserInput,
  CreateUserSchema,
  UpdateUserInput,
  UpdateUserSchema,
} from '@/features/users/schema';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

export async function createUserAction(input: CreateUserInput): Promise<ActionResult<User>> {
  const validate = CreateUserSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  try {
    await api.createUser(validate.data);
    revalidatePath('/users');

    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user.',
    };
  }
}

export async function updateUserAction(
  id: number,
  input: UpdateUserInput,
): Promise<ActionResult<User>> {
  const validate = UpdateUserSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  try {
    await api.updateUser(id, validate.data);
    revalidatePath('/users');

    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change user.',
    };
  }
}

export async function deleteUserAction(id: number): Promise<ActionResult<User>> {
  try {
    await api.deleteUser(id);
    revalidatePath('/users');

    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user.',
    };
  }
}
