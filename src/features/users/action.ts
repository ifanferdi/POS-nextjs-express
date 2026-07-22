'use server';

import {
  CreateUserInput,
  CreateUserSchema,
  UpdateUserInput,
  UpdateUserSchema,
} from '@/features/users/schema';
import { createServerApiClient } from '@/lib/api-server';
import { calculateAge } from '@/lib/helper';
import { revalidatePath } from 'next/cache';

export interface ActionResult {
  success: boolean;
  error?: string;
}

function buildPayload(data: CreateUserInput | UpdateUserInput) {
  return {
    username: data.username,
    password: data.password,
    confirmPassword: data.confirmPassword,
    isActive: data.isActive,
    roleId: data.roleId,
    profile: {
      ...data.profile,
      age: calculateAge(new Date(data.profile.dateOfBirth)),
    },
  };
}

export async function createUserAction(input: CreateUserInput): Promise<ActionResult> {
  const validate = CreateUserSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Input tidak valid.' };

  try {
    const api = await createServerApiClient();
    await api.post('/v1/users', buildPayload(validate.data));
    revalidatePath('/users');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal membuat user.',
    };
  }
}

export async function updateUserAction(id: number, input: UpdateUserInput): Promise<ActionResult> {
  const validate = UpdateUserSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Input tidak valid.' };

  try {
    const api = await createServerApiClient();
    await api.put(`/v1/users/${id}`, buildPayload(validate.data));
    revalidatePath('/users');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengubah user.',
    };
  }
}

export async function deleteUserAction(id: number): Promise<ActionResult> {
  try {
    const api = await createServerApiClient();
    await api.delete(`/v1/users/${id}`);
    revalidatePath('/users');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menghapus user.',
    };
  }
}
