import { Payment } from '@/domain';
import { createServerApiClient } from '@/lib/api-server';
import {
  GetPaymentByOrderIdInput,
  GetPaymentByOrderIdSchema,
  MockMidtransPaymentInput,
} from './schema';

export async function getPaymentByOrderId<T = Payment>(input: GetPaymentByOrderIdInput) {
  const { orderId, ...params } = GetPaymentByOrderIdSchema.parse(input);
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
