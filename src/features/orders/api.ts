import { ApiResponse, Order, PaginatedResponse } from '@/domain';
import {
  CreateOrderInput,
  GetAllOrderParams,
  OrderRelationParams,
  UpdateOrderInput,
} from '@/features/orders/schema';
import { createServerApiClient } from '@/lib/api-server';

interface OrderApiResponse extends ApiResponse {
  order: Order;
}

export async function getAllOrders<T = Order>(params: GetAllOrderParams) {
  const api = await createServerApiClient();
  const response = await api.get<PaginatedResponse<T>>('/v1/orders', { params });
  return response.data;
}

export async function getOrderById<T = Order>(id: number, relation?: OrderRelationParams) {
  const api = await createServerApiClient();
  const response = await api.get<T>(`/v1/orders/${id}`, {
    params: { with: relation },
  });
  return response.data;
}

export async function createOrder(input: CreateOrderInput) {
  const api = await createServerApiClient();
  const response = await api.post<OrderApiResponse>('/v1/orders', input);

  return response.data;
}

export async function updateOrder(id: number, input: UpdateOrderInput) {
  const api = await createServerApiClient();
  const response = await api.put<OrderApiResponse>(`/v1/orders/${id}`, input);

  return response.data;
}

export async function deleteOrder(id: number) {
  const api = await createServerApiClient();
  const response = await api.delete<ApiResponse>(`/v1/orders/${id}`);

  return response.data;
}
