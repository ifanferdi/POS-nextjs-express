'use server';

import { auth } from '@/auth';
import { ActionResult, Payment } from '@/domain';
import * as api from '@/features/payments/api';
import { PERMISSION, requirePermission } from '@/lib/permission';
import { unstable_rethrow } from 'next/navigation';
import {
  GetPaymentByOrderIdInput,
  MockMidtransPaymentInput,
  MockMidtransPaymentSchema,
} from './schema';

export async function getPaymentByOrderId<T = Payment>(input: GetPaymentByOrderIdInput) {
  try {
    const session = await auth();
    requirePermission(session?.user.permissions, [PERMISSION.SHOW_PAYMENT]);

    const response = await api.getPaymentByOrderId<T>(input);
    return response;
  } catch (error) {
    unstable_rethrow(error);
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
    unstable_rethrow(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mock midtrans payment.',
    };
  }
}
