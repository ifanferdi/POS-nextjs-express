import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '../domain/entities/enums/payment.enum';
import { UserRelation } from '../domain/entities/enums/user.enum';
import { PAYMENT_FIELD } from '../domain/entities/models/payment';
import { BaseFindById, BasePagination, NumberSchema, StringSchema } from './base-validation';

const Relations = z.array(z.nativeEnum(UserRelation).optional()).optional();

export const FindByIdPaymentSchema = BaseFindById;
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
export const CreatePaymentSchema = z.object({
  orderId: NumberSchema,
  amount: NumberSchema,
  method: z.nativeEnum(PaymentMethod),
  reference: StringSchema.max(255).optional(),
});

export interface FindOnePaymentDto extends z.infer<typeof FindOnePaymentSchema> {}
export interface FindAllPaymentDto extends z.infer<typeof FindAllPaymentSchema> {}
export interface FindByIdPaymentDto extends z.infer<typeof FindByIdPaymentSchema> {}
export interface CreatePaymentDto extends z.infer<typeof CreatePaymentSchema> {}
