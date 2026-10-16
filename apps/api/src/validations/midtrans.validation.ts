import { PaymentMethod } from '@/domain/entities/enums/payment.enum';
import { MidtransWebhookPayload } from '@/domain/infrastructures/midtrans.interface';
import { NumberSchema, StringSchema } from '@/validations/base-validation';
import z from 'zod';

export const MidtransWebhookSchema = z.object({ orderNumber: StringSchema });

export const MockMidtransWebhook = z.object({
  orderNumber: StringSchema,
  paymentMethod: z.nativeEnum(PaymentMethod),
  grossAmount: NumberSchema,
});
export const MockMidtransSchema = z.object({
  orderNumber: z.string().trim().min(1),
  transactionStatus: z
    .enum(['settlement', 'expire', 'cancel', 'deny'])
    .optional()
    .default('settlement'),
  grossAmount: z.number().optional().default(0),
});

export interface MidtransWebhookDto extends z.infer<typeof MidtransWebhookSchema> {
  notification: MidtransWebhookPayload;
}
export interface MockMidtransWebhookDto extends z.infer<typeof MockMidtransWebhook> {}
export interface MockMidtransDto extends z.infer<typeof MockMidtransSchema> {}
