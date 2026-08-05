import { OrderRelation, OrderStatus, PaymentMethod } from '@/domain';
import { BasePagination, idSchema, numberSchema, optionalStringSchema } from '@/lib/base.schema';
import { z } from 'zod';

const Relation = z.array(z.enum(OrderRelation)).optional();

export const GetAllOrderSchema = BasePagination.extend({
  status: z.enum(OrderStatus).optional(),
  paymentMethod: z.enum(PaymentMethod).optional(),
  customerId: z.union([numberSchema, z.array(numberSchema)]).optional(),
  userId: z.union([numberSchema, z.array(numberSchema)]).optional(),
  with: Relation,
});

const OrderItemSchema = z.object({
  productId: idSchema,
  quantity: numberSchema.min(1),
});

const BaseOrderSchema = z.object({
  customerId: idSchema.nullable(),
  userId: idSchema.nullable(),
  status: z.enum(OrderStatus),
  paymentMethod: z.enum(PaymentMethod),
  notes: optionalStringSchema,
  orderItems: z.array(OrderItemSchema).min(1),
});

export const CreateOrderSchema = BaseOrderSchema;
export const UpdateOrderSchema = CreateOrderSchema;

export type OrderRelationParams = z.infer<typeof Relation>;
export type GetAllOrderParams = z.infer<typeof GetAllOrderSchema>;
export type CreateOrderInput = z.input<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.input<typeof UpdateOrderSchema>;