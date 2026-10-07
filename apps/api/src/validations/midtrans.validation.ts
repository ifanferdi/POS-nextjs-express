import { PaymentMethod } from '@/domain/entities/enums/payment.enum';
import { MidtransWebhookPayload } from '@/domain/infrastructures/midtrans.interface';
import { NumberSchema, StringSchema } from '@/validations/base-validation';
import z from 'zod';

export const SyncMidtransToDatabaseSchema = z.object({ orderNumber: StringSchema });

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

export interface SyncMidtransToDatabaseDto extends z.infer<typeof SyncMidtransToDatabaseSchema> {
  notification: MidtransWebhookPayload;
}
export interface MockMidtransWebhookDto extends z.infer<typeof MockMidtransWebhook> {}
export interface MockMidtransDto extends z.infer<typeof MockMidtransSchema> {}
