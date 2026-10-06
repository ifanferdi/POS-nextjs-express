'use server';

import { auth } from '@/auth';
import { ActionResult, Category } from '@/domain';
import * as api from '@/features/categories/api';
import {
  CreateCategoryInput,
  CreateCategorySchema,
  UpdateCategoryInput,
  UpdateCategorySchema,
} from '@/features/categories/schema';
import { PERMISSION, requirePermission } from '@/lib/permission';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

export async function createCategoryAction(
  input: CreateCategoryInput,
): Promise<ActionResult<Category>> {
  const validate = CreateCategorySchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  try {
    const session = await auth();
    requirePermission(session?.user.permissions, [PERMISSION.MANAGE_CATEGORY]);

    const { category: data } = await api.createCategory(validate.data);
    revalidatePath('/categories');

    return { success: true, data };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create category.',
    };
  }
}

export async function updateCategoryAction(
  id: number,
  input: UpdateCategoryInput,
): Promise<ActionResult<Category>> {
  const validate = UpdateCategorySchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  try {
    const session = await auth();
    requirePermission(session?.user.permissions, [PERMISSION.MANAGE_CATEGORY]);

    await api.updateCategory(id, validate.data);
    revalidatePath('/categories');

    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change Category.',
    };
  }
}

export async function deleteCategoryAction(id: number): Promise<ActionResult<Category>> {
  try {
    const session = await auth();
    requirePermission(session?.user.permissions, [PERMISSION.MANAGE_CATEGORY]);

    await api.deleteCategory(id);
    revalidatePath('/categories');

    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete Category.',
    };
  }
}
