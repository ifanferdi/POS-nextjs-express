'use server';

import { auth } from '@/auth';
import { ActionResult, PaginatedResponse, Product } from '@/domain';
import * as api from '@/features/products/api';
import {
  CreateProductInput,
  CreateProductSchema,
  GetAllProductParams,
  UpdateProductInput,
  UpdateProductSchema,
} from '@/features/products/schema';
import { guard } from '@/lib/helper';
import { PERMISSION, requirePermission } from '@/lib/permission';
import { revalidatePath } from 'next/cache';

export async function createProductAction(
  input: CreateProductInput,
): Promise<ActionResult<Product>> {
  const validate = CreateProductSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  return await guard(async () => {
    const session = await auth();
    requirePermission(session?.user.permissions, [PERMISSION.MANAGE_PRODUCT]);

    await api.createProduct(validate.data);
    revalidatePath('/products');

    return { success: true };
  }, 'Failed to create product.');
}

export async function updateProductAction(
  id: number,
  input: UpdateProductInput,
): Promise<ActionResult<Product>> {
  return await guard(async () => {
    const validate = UpdateProductSchema.safeParse(input);
    if (!validate.success) throw new Error(validate.error.message);

    const session = await auth();
    requirePermission(session?.user.permissions, [PERMISSION.MANAGE_PRODUCT]);

    await api.updateProduct(id, validate.data);
    revalidatePath('/products');

    return { success: true };
  }, 'Failed to change product.');
}

export async function deleteProductAction(id: number): Promise<ActionResult<Product>> {
  return await guard(async () => {
    const session = await auth();
    requirePermission(session?.user.permissions, [PERMISSION.MANAGE_PRODUCT]);

    await api.deleteProduct(id);
    revalidatePath('/products');

    return { success: true };
  }, 'Failed to delete product.');
}

export async function getAllProductsAction<T = Product>(
  params: GetAllProductParams,
): Promise<PaginatedResponse<T>> {
  return await guard(async () => await api.getAllProducts(params), 'Failed to fetch products.');
}
