import { z } from 'zod';
import { PaymentMethod, PaymentStatus } from '../domain/entities/enums/payment.enum';
import { PaymentScalarFieldEnum } from '../infrastructure/database/prisma/generated/internal/prismaNamespace';
import { BaseFindById, BasePagination, NumberSchema, StringSchema } from './base-validation';

const PAYMENT_FIELD = PaymentScalarFieldEnum;
type PAYMENT_FIELD = (typeof PAYMENT_FIELD)[keyof typeof PAYMENT_FIELD];

export const FindByIdPaymentSchema = BaseFindById;
export const FindAllPaymentSchema = BasePagination(PAYMENT_FIELD).extend({
  orderId: z.union([NumberSchema, z.array(NumberSchema)]).optional(),
  method: z.union([z.nativeEnum(PaymentMethod), z.array(z.nativeEnum(PaymentMethod))]).optional(),
  status: z.union([z.nativeEnum(PaymentStatus), z.array(z.nativeEnum(PaymentStatus))]).optional(),
});
export const CreatePaymentSchema = z.object({
  orderId: NumberSchema,
  amount: NumberSchema,
  method: z.nativeEnum(PaymentMethod),
  reference: StringSchema.max(255).optional(),
});

export interface FindAllPaymentDto extends z.infer<typeof FindAllPaymentSchema> {}
export interface FindByIdPaymentDto extends z.infer<typeof FindByIdPaymentSchema> {}
export interface CreatePaymentDto extends z.infer<typeof CreatePaymentSchema> {}
