import { PaymentRelation } from '@/domain';
import { numberSchema } from '@/lib/base.schema';
import z from 'zod';

const Relation = z.array(z.enum(PaymentRelation)).optional();
export const GetPaymentByOrderIdSchema = z.object({
  orderId: numberSchema,
  with: Relation,
  columns: z.array(z.string()).optional(),
});

export type GetPaymentByOrderIdInput = z.input<typeof GetPaymentByOrderIdSchema>;
