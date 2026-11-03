'use server';

import { auth } from '@/auth';
import { ActionResult, DiscountQuotaShortage } from '@/domain';
import { guard } from '@/lib/helper';
import { PERMISSION, requirePermission } from '@/lib/permission';
import { revalidatePath } from 'next/cache';
import { unstable_rethrow } from 'next/navigation';
import * as api from './api';
import {
  CheckQuotaInput,
  CheckQuotaSchema,
  CreateProductDiscountCycleInput,
  CreateProductDiscountCycleSchema,
  GetAllProductDiscountCycleParams,
  UpdateProductDiscountCycleInput,
  UpdateProductDiscountCycleSchema,
} from './schema';

export type CheckQuotaActionResult =
  { valid: true } | { valid: false; shortages: DiscountQuotaShortage[]; error?: string };

export async function getAllProductDiscountCyclesAction(params: GetAllProductDiscountCycleParams) {
  return await guard(async () => {
    const session = await auth();
    requirePermission(session?.user.permissions, [PERMISSION.SHOW_PRODUCT_DISCOUNT_CYCLE]);

    return await api.getAllProductDiscountCycles(params);
  }, 'Failed to fetch discount cycles.');
}

export async function createProductDiscountCycleAction(
  input: CreateProductDiscountCycleInput,
): Promise<ActionResult<void>> {
  const validate = CreateProductDiscountCycleSchema.safeParse(input);
  if (!validate.success)
    return { success: false, error: validate.error.issues[0]?.message ?? 'Invalid input.' };

  return await guard(async () => {
    const session = await auth();
    requirePermission(session?.user.permissions, [PERMISSION.MANAGE_PRODUCT_DISCOUNT_CYCLE]);

    await api.createProductDiscountCycle(validate.data);
    revalidatePath('/product-discount-cycles');
    revalidatePath('/products');
    revalidatePath('/pos');

    return { success: true };
  }, 'Failed to create discount cycle.');
}

export async function updateProductDiscountCycleAction(
  id: number,
  input: UpdateProductDiscountCycleInput,
): Promise<ActionResult<void>> {
  const validate = UpdateProductDiscountCycleSchema.safeParse(input);
  if (!validate.success)
    return { success: false, error: validate.error.issues[0]?.message ?? 'Invalid input.' };

  return await guard(async () => {
    const session = await auth();
    requirePermission(session?.user.permissions, [PERMISSION.MANAGE_PRODUCT_DISCOUNT_CYCLE]);

    await api.updateProductDiscountCycle(id, validate.data);
    revalidatePath('/product-discount-cycles');
    revalidatePath('/products');
    revalidatePath('/pos');

    return { success: true };
  }, 'Failed to update discount cycle.');
}

export async function deleteProductDiscountCycleAction(id: number): Promise<ActionResult<void>> {
  return await guard(async () => {
    const session = await auth();
    requirePermission(session?.user.permissions, [PERMISSION.MANAGE_PRODUCT_DISCOUNT_CYCLE]);

    await api.deleteProductDiscountCycle(id);
    revalidatePath('/product-discount-cycles');
    revalidatePath('/products');
    revalidatePath('/pos');

    return { success: true };
  }, 'Failed to delete discount cycle.');
}

export async function checkProductDiscountQuotaAction(
  items: CheckQuotaInput,
): Promise<CheckQuotaActionResult> {
  const validate = CheckQuotaSchema.safeParse(items);
  if (!validate.success) return { valid: false, shortages: [] };

  try {
    // Backend yang menentukan izin endpoint ini (`Show Product Discount Cycle`).
    return await api.checkProductDiscountQuota(validate.data);
  } catch (error) {
    unstable_rethrow(error);
    return {
      valid: false,
      shortages: [],
      error: error instanceof Error ? error.message : 'Failed to check discount quota.',
    };
  }
}
