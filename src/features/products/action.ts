'use server';

import { ActionResult, Product, ProductRelation } from '@/domain';
import * as api from '@/features/products/api';
import {
  CreateProductInput,
  CreateProductSchema,
  UpdateProductInput,
  UpdateProductSchema,
} from '@/features/products/schema';
import { revalidatePath } from 'next/cache';

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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete product.',
    };
  }
}

// ponytail: read action untuk client-triggered paginated fetch (POS load-more).
// Read actions secara konvensi pakai api.ts dari server component, tapi trigger dari
// client memaksa lewat server action supaya token httpOnly tetap di server.
export async function fetchProductsAction(limit: number): Promise<{
  products: Product[];
  total: number;
}> {
  try {
    const { data: products, total } = await api.getAllProducts<Product>({
      isActive: true,
      limit,
      orderBy: ['name:asc'],
      with: [ProductRelation.CATEGORIES],
    });
    return { products, total };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to load product.');
  }
}
