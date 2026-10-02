'use server';

import { ActionResult, Order, OrderApiResponse, OrderDetail, PaginatedResponse } from '@/domain';
import * as api from '@/features/orders/api';
import {
  CreateOrderInput,
  CreateOrderSchema,
  GetAllOrderParams,
  OrderRelationParams,
  UpdateOrderInput,
  UpdateOrderSchema,
} from '@/features/orders/schema';
import { defaultPaginatedResponse } from '@/lib/helper';
import { revalidatePath } from 'next/cache';

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<ActionResult<OrderApiResponse['order']>> {
  const validate = CreateOrderSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  try {
    const response = await api.createOrder(validate.data);
    revalidatePath('/orders');

    return { success: true, data: response.order };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order.',
    };
  }
}

export async function getOrdersAction<T = Order>(
  params: GetAllOrderParams,
): Promise<PaginatedResponse<T>> {
  try {
    const response = await api.getAllOrders<T>(params);
    return response;
  } catch (error) {
    console.error(error);
    return defaultPaginatedResponse;
  }
}

export async function getOrderByIdAction<T = OrderDetail>(
  id: number,
  relation?: OrderRelationParams,
): Promise<T> {
  return api.getOrderById<T>(id, relation);
}

export async function updateOrderAction(
  id: number,
  input: UpdateOrderInput,
): Promise<ActionResult<Order>> {
  const validate = UpdateOrderSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  try {
    await api.updateOrder(id, validate.data);
    revalidatePath('/orders');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order.',
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
      error: error instanceof Error ? error.message : 'Failed to delete order.',
    };
  }
}
