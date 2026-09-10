import { OrderRelation, OrderStatus } from '@/domain';
import { PaymentMethod } from '@/domain/payment.types';
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

const BaseOrderSchema = z
  .object({
    customerId: idSchema.optional().nullable(),
    notes: optionalStringSchema,
    items: z.array(OrderItemSchema).min(1),
    paymentMethod: z.enum(PaymentMethod),
    amount: numberSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const amount = data.amount;
    const paymentMethod = data.paymentMethod;

    if (paymentMethod === PaymentMethod.CASH) {
      if (!amount)
        ctx.addIssue({
          path: ['amount'],
          code: 'custom',
          message: 'Amount is required for cash payments!',
        });
    }
  });

export const PosCheckoutFormSchema = z
  .object({
    subtotal: z.number().min(0),
    paymentMethod: z.enum(PaymentMethod),
    notes: optionalStringSchema,
    amountTendered: z.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    const tendered = data.amountTendered;
    const isCash = data.paymentMethod === PaymentMethod.CASH;

    if (isCash) {
      if (!tendered) {
        ctx.addIssue({
          path: ['amountTendered'],
          code: 'custom',
          message: 'Amount is required for cash payments!',
        });
      }
      if (tendered && tendered < data.subtotal) {
        ctx.addIssue({
          code: 'custom',
          path: ['amountTendered'],
          message: 'Amount tendered cannot less than subtotal.',
        });
      }
    } else {
      if (tendered) {
        ctx.addIssue({
          path: ['amountTendered'],
          code: 'custom',
          message: 'Amount is only allowed for cash payments!',
        });
      }
    }
  });

export const CreateOrderSchema = BaseOrderSchema;
export const UpdateOrderSchema = CreateOrderSchema;

export type OrderRelationParams = z.infer<typeof Relation>;
export type GetAllOrderParams = z.infer<typeof GetAllOrderSchema>;
export type CreateOrderInput = z.input<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.input<typeof UpdateOrderSchema>;
export type PosCheckoutForm = z.input<typeof PosCheckoutFormSchema>;
