import { Payment } from '@/domain';
import { createServerApiClient } from '@/lib/api-server';
import { GetPaymentByOrderIdInput } from './schema';

export async function getPaymentByOrderId<T = Payment>({
  orderId,
  ...params
}: GetPaymentByOrderIdInput): Promise<T> {
  const api = await createServerApiClient();
  const response = await api.get<T>(`/v1/payments/${orderId}/order`, {
    params,
  });
  return response.data;
}
