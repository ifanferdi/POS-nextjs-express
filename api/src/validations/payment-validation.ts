import {
  PaymentMethod,
  PaymentRelation,
  PaymentStatus,
} from '@/domain/entities/enums/payment.enum';
import { PAYMENT_FIELD } from '@/domain/entities/models/payment';
import {
  BaseFindById,
  BasePagination,
  BooleanSchema,
  DateSchema,
  NumberSchema,
  StringSchema,
} from '@/validations/base-validation';
import { z } from 'zod';

const Relations = z.array(z.nativeEnum(PaymentRelation).optional()).optional();

export const FindByIdPaymentSchema = BaseFindById.extend({
  columns: z.array(z.nativeEnum(PAYMENT_FIELD)).optional(),
  with: Relations,
});
export const FindOnePaymentSchema = z
  .object({
    id: NumberSchema.optional(),
    orderId: NumberSchema.optional(),
    columns: z.array(z.nativeEnum(PAYMENT_FIELD)).optional(),
    with: Relations,
  })
  .refine((data) => !data.id && !data.orderId, {
    message: 'Must use one one of id or orderId.',
  });
export const FindAllPaymentSchema = BasePagination(PAYMENT_FIELD).extend({
  orderId: z.union([NumberSchema, z.array(NumberSchema)]).optional(),
  method: z.union([z.nativeEnum(PaymentMethod), z.array(z.nativeEnum(PaymentMethod))]).optional(),
  status: z.union([z.nativeEnum(PaymentStatus), z.array(z.nativeEnum(PaymentStatus))]).optional(),
  with: Relations,
});
const midtransDetail = z
  .object({
    midtransOrderId: StringSchema.max(50),
    transactionId: StringSchema.max(100).optional(),
    paymentType: StringSchema.max(30).optional(),
    transactionStatus: StringSchema.max(30).optional(),
    fraudStatus: StringSchema.max(30).optional(),
    vaNumber: StringSchema.max(50).optional(),
    qrCodeUrl: StringSchema.max(500).optional(),
    expiryTime: DateSchema.optional(),
    signatureVerified: BooleanSchema.optional(),
    processedAt: DateSchema.optional(),
    rawNotification: z.record(z.any()).optional(),
  })
  .optional();
export const CreatePaymentSchema = z.object({
  orderId: NumberSchema,
  amount: NumberSchema,
  subtotal: NumberSchema,
  rounding: NumberSchema.optional(),
  total: NumberSchema,
  change: NumberSchema.optional(),
  method: z.nativeEnum(PaymentMethod),
  reference: StringSchema.max(255).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  paidAt: DateSchema.optional(),
  expiredAt: DateSchema.optional(),
  midtransDetail,
});
export const UpdatePaymentSchema = CreatePaymentSchema.extend({
  orderId: NumberSchema.optional(),
  amount: NumberSchema.optional(),
  subtotal: NumberSchema.optional(),
  total: NumberSchema.optional(),
  method: z.nativeEnum(PaymentMethod).optional(),
  rounding: NumberSchema.optional(),
  change: NumberSchema.optional(),
  reference: StringSchema.max(255).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  paidAt: DateSchema.optional(),
  expiredAt: DateSchema.optional(),
  midtransDetail,
});

export type FindOnePaymentDto<TCols extends readonly PAYMENT_FIELD[] | undefined> = Omit<
  z.infer<typeof FindOnePaymentSchema>,
  'columns'
> & { columns?: TCols };
// export interface FindOnePaymentDto extends z.infer<typeof FindOnePaymentSchema> {}
export interface FindAllPaymentDto extends z.infer<typeof FindAllPaymentSchema> {}
export interface FindByIdPaymentDto extends z.infer<typeof FindByIdPaymentSchema> {}
export interface CreatePaymentDto extends z.infer<typeof CreatePaymentSchema> {}
export interface UpdatePaymentDto extends z.infer<typeof UpdatePaymentSchema> {}
