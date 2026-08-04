'use server';

import {
  CreateCategoryInput,
  CreateCategorySchema,
  UpdateCategoryInput,
  UpdateCategorySchema,
} from '@/features/categories/schema';
import { revalidatePath } from 'next/cache';
import * as api from './api';

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createCategoryAction(input: CreateCategoryInput): Promise<ActionResult> {
  const validate = CreateCategorySchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Input tidak valid.' };

  try {
    await api.createCategory(validate.data);
    revalidatePath('/categories');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal membuat Category.',
    };
  }
}

export async function updateCategoryAction(
  id: number,
  input: UpdateCategoryInput,
): Promise<ActionResult> {
  const validate = UpdateCategorySchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Input tidak valid.' };

  try {
    await api.updateCategory(id, validate.data);
    revalidatePath('/categories');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengubah Category.',
    };
  }
}

export async function deleteCategoryAction(id: number): Promise<ActionResult> {
  try {
    await api.deleteCategory(id);
    revalidatePath('/categories');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menghapus Category.',
    };
  }
}
