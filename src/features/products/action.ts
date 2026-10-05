'use server';

import { ActionResult, PaginatedResponse, Product } from '@/domain';
import * as api from '@/features/products/api';
import {
  CreateProductInput,
  CreateProductSchema,
  GetAllProductParams,
  UpdateProductInput,
  UpdateProductSchema,
} from '@/features/products/schema';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';

export async function createProductAction(
  input: CreateProductInput,
): Promise<ActionResult<Product>> {
  const validate = CreateProductSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  try {
    await api.createProduct(validate.data);
    revalidatePath('/products');

    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create product.',
    };
  }
}

export async function updateProductAction(
  id: number,
  input: UpdateProductInput,
): Promise<ActionResult<Product>> {
  const validate = UpdateProductSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  try {
    await api.updateProduct(id, validate.data);
    revalidatePath('/products');

    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change product.',
    };
  }
}

export async function deleteProductAction(id: number): Promise<ActionResult<Product>> {
  try {
    await api.deleteProduct(id);
    revalidatePath('/products');

    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete product.',
    };
  }
}

export async function getAllProductsAction<T = Product>(
  params: GetAllProductParams,
): Promise<PaginatedResponse<T>> {
  try {
    return await api.getAllProducts(params);
  } catch (error) {
    unstable_rethrow(error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch products.');
  }
}
