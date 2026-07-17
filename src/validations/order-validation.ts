import { z } from 'zod';
import { OrderRelation } from '../domain/entities/enums/order.enum';
import { ORDER_FIELD } from '../domain/entities/models/order';
import { OrderStatus } from '../domain/entities/enums/order.enum';
import { PaymentMethod } from '../domain/entities/enums/payment.enum';
import { BaseFindById, BasePagination, NumberSchema, StringSchema } from './base-validation';

const Relations = z.array(z.nativeEnum(OrderRelation).optional()).optional();
const columns = z.array(z.nativeEnum(ORDER_FIELD)).optional();

export const FindByIdOrderSchema = BaseFindById.extend({ with: Relations, columns });
export const FindAllOrderSchema = BasePagination(ORDER_FIELD)
  .extend({
    status: z.union([z.nativeEnum(OrderStatus), z.array(z.nativeEnum(OrderStatus))]).optional(),
    paymentMethod: z.union([z.nativeEnum(PaymentMethod), z.array(z.nativeEnum(PaymentMethod))]).optional(),
    customerId: z.union([NumberSchema, z.array(NumberSchema)]).optional(),
    userId: z.union([NumberSchema, z.array(NumberSchema)]).optional(),
    with: Relations,
    createdAtDay: z.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ids && data.notId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ids and notId params cannot be used together!',
      });
  });

const OrderItemSchema = z.object({
  productId: NumberSchema,
  quantity: NumberSchema.min(1).default(1),
});

export const CreateOrderSchema = z.object({
  customerId: NumberSchema.optional(),
  userId: NumberSchema.optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: StringSchema.optional(),
  items: z.array(OrderItemSchema).min(1),
  paymentReference: StringSchema.max(255).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  id: NumberSchema,
  status: z.nativeEnum(OrderStatus),
});

export interface FindAllOrderDto extends z.infer<typeof FindAllOrderSchema> {}
export interface FindByIdOrderDto extends z.infer<typeof FindByIdOrderSchema> {}
export interface CreateOrderDto extends z.infer<typeof CreateOrderSchema> {}
export interface UpdateOrderStatusDto extends z.infer<typeof UpdateOrderStatusSchema> {}
