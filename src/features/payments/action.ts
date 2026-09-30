'use server';

import { ActionResult, Payment } from '@/domain';
import * as api from '@/features/payments/api';
import {
  GetPaymentByOrderIdInput,
  MockMidtransPaymentInput,
  MockMidtransPaymentSchema,
} from './schema';

export async function getPaymentByOrderId<T = Payment>(input: GetPaymentByOrderIdInput) {
  try {
    const response = await api.getPaymentByOrderId<T>(input);
    return response;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to load payment.');
  }
}

export async function mockMidtransPaymentAction(
  input: MockMidtransPaymentInput,
): Promise<ActionResult<Payment>> {
  const validate = MockMidtransPaymentSchema.safeParse(input);
  if (!validate.success) return { success: false, error: 'Invalid input.' };

  try {
    await api.mockMidtransPayment(validate.data);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mock midtrans payment.',
    };
  }
}
