import { Payment } from '@/domain';
import { createServerApiClient } from '@/lib/api-server';
import { GetPaymentByOrderIdInput, MockMidtransPaymentInput } from './schema';

export async function getPaymentByOrderId<T = Payment>({
  orderId,
  ...params
}: GetPaymentByOrderIdInput) {
  const api = await createServerApiClient();
  const response = await api.get<T>(`/v1/payments/${orderId}/order`, {
    params,
  });
  return response.data;
}

export async function mockMidtransPayment(body: MockMidtransPaymentInput) {
  const api = await createServerApiClient();
  const response = await api.post<Payment>('/v1/webhooks/midtrans/mock', body);
  return response.data;
}
