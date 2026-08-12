'use server';

import { ActionResult, Product, ProductRelation } from '@/domain';
import {
  CreateProductInput,
  CreateProductSchema,
  UpdateProductInput,
  UpdateProductSchema,
} from '@/features/products/schema';
import { revalidatePath } from 'next/cache';
import * as api from './api';

export async function createProductAction(
  input: CreateProductInput,
): Promise<ActionResult<Product>> {
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
): Promise<ActionResult<Product>> {
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

export async function deleteProductAction(id: number): Promise<ActionResult<Product>> {
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
    throw new Error(error instanceof Error ? error.message : 'Gagal memuat produk.');
  }
}
