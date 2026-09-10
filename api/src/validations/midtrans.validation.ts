import { MidtransWebhookPayload } from '@/domain/infrastructures/midtrans.interface';
import { StringSchema } from '@/validations/base-validation';
import z from 'zod';

export const SyncMidtransToDatabaseSchema = z.object({ orderNumber: StringSchema });

export interface SyncMidtransToDatabaseDto extends z.infer<typeof SyncMidtransToDatabaseSchema> {
  notification?: MidtransWebhookPayload;
}
