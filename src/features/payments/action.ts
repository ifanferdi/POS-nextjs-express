'use server';

import { Payment } from '@/domain';
import * as api from '@/features/payments/api';
import { GetPaymentByOrderIdInput } from './schema';

export async function getPaymentByOrderId<T = Payment>(
  input: GetPaymentByOrderIdInput,
): Promise<T> {
  try {
    const response = await api.getPaymentByOrderId<T>(input);
    return response;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to load payment.');
  }
}
