import { PaymentMethod, PaymentRelation } from '@/domain';
import { numberSchema, stringSchema } from '@/lib/base.schema';
import z from 'zod';

const Relation = z.array(z.string().trim().pipe(z.enum(PaymentRelation))).optional();
export const GetPaymentByOrderIdSchema = z.object({
  orderId: numberSchema,
  with: Relation,
  columns: z.array(stringSchema).optional(),
});
export const MockMidtransPaymentSchema = z.object({
  orderNumber: stringSchema,
  paymentMethod: z.string().trim().pipe(z.enum(PaymentMethod)),
  grossAmount: numberSchema,
});

export type GetPaymentByOrderIdInput = z.input<typeof GetPaymentByOrderIdSchema>;
export type MockMidtransPaymentInput = z.input<typeof MockMidtransPaymentSchema>;
