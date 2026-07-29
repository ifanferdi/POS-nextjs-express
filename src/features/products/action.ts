'use server';

import {
  CreateProductInput,
  CreateProductSchema,
  UpdateProductInput,
  UpdateProductSchema,
} from '@/features/products/schema';
import { revalidatePath } from 'next/cache';
import * as api from './api';

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createProductAction(input: CreateProductInput): Promise<ActionResult> {
  const validate = CreateProductSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Input tidak valid.' };

  try {
    await api.createProduct(validate.data);
    revalidatePath('/products');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal membuat product.',
    };
  }
}

export async function updateProductAction(
  id: number,
  input: UpdateProductInput,
): Promise<ActionResult> {
  const validate = UpdateProductSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Input tidak valid.' };

  try {
    await api.updateProduct(id, validate.data);
    revalidatePath('/products');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengubah product.',
    };
  }
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
  try {
    await api.deleteProduct(id);
    revalidatePath('/products');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menghapus product.',
    };
  }
}
