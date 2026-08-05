'use server';

import { ActionResult, Order } from '@/domain';
import {
  CreateOrderInput,
  CreateOrderSchema,
  UpdateOrderInput,
  UpdateOrderSchema,
} from '@/features/orders/schema';
import { revalidatePath } from 'next/cache';
import * as api from './api';

export async function createOrderAction(input: CreateOrderInput): Promise<ActionResult<Order>> {
  const validate = CreateOrderSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Input tidak valid.' };

  try {
    await api.createOrder(validate.data);
    revalidatePath('/orders');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal membuat order.',
    };
  }
}

export async function updateOrderAction(
  id: number,
  input: UpdateOrderInput,
): Promise<ActionResult<Order>> {
  const validate = UpdateOrderSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Input tidak valid.' };

  try {
    await api.updateOrder(id, validate.data);
    revalidatePath('/orders');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengubah order.',
    };
  }
}

export async function deleteOrderAction(id: number): Promise<ActionResult<Order>> {
  try {
    await api.deleteOrder(id);
    revalidatePath('/orders');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menghapus order.',
    };
  }
}