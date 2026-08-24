import { OrderRelation, OrderStatus, PaymentMethod } from '@/domain';
import {
  BasePagination,
  idSchema,
  numberSchema,
  optionalStringSchema,
  requiredStringSchema,
} from '@/lib/base.schema';
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
    userId: idSchema.nullable().optional(),
    notes: optionalStringSchema,
    items: z.array(OrderItemSchema).min(1),
    paymentMethod: z.enum(PaymentMethod),
    paymentReference: requiredStringSchema('Payment Reference').max(255).optional(),
    amount: numberSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const amount = data.amount;
    const paymentMethod = data.paymentMethod;
    const paymentReference = data.paymentReference;

    if (paymentMethod === PaymentMethod.CASH) {
      if (!amount)
        ctx.addIssue({
          path: ['amount'],
          code: 'custom',
          message: 'Amount is required for cash payments!',
        });

      if (paymentReference)
        ctx.addIssue({
          path: ['paymentReference'],
          code: 'custom',
          message: 'Payment reference is not allowed for cash payments!',
        });
    }

    if ([PaymentMethod.TRANSFER, PaymentMethod.CARD].includes(paymentMethod)) {
      if (amount)
        ctx.addIssue({
          path: ['amount'],
          code: 'custom',
          message: 'Amount is only allowed for cash payments!',
        });

      if (paymentMethod === PaymentMethod.TRANSFER && !paymentReference)
        ctx.addIssue({
          path: ['paymentReference'],
          code: 'custom',
          message: 'Payment reference is required for transfer payments!',
        });
      if (paymentMethod === PaymentMethod.CARD && !paymentReference)
        ctx.addIssue({
          path: ['paymentReference'],
          code: 'custom',
          message: 'Payment reference is required for card payments!',
        });
    }
  });

export const PosCheckoutFormSchema = z
  .object({
    subtotal: z.number().min(0),
    paymentMethod: z.enum(PaymentMethod),
    paymentReference: z.string().trim().optional(),
    notes: optionalStringSchema,
    amountTendered: z.number().min(0).optional(),
  })
  .superRefine((data, ctx) => {
    const tendered = data.amountTendered;
    const paymentMethod = data.paymentMethod;
    const paymentReference = data.paymentReference;

    if (paymentMethod === PaymentMethod.CASH) {
      if (tendered && tendered < data.subtotal)
        ctx.addIssue({
          code: 'custom',
          path: ['amountTendered'],
          message: 'Amount tendered cannot less than subtotal.',
        });

      if (!tendered)
        ctx.addIssue({
          path: ['amountTendered'],
          code: 'custom',
          message: 'Amount is required for cash payments!',
        });

      if (paymentReference)
        ctx.addIssue({
          path: ['paymentReference'],
          code: 'custom',
          message: 'Payment reference is not allowed for cash payments!',
        });
    }
    if ([PaymentMethod.TRANSFER, PaymentMethod.CARD].includes(paymentMethod)) {
      if (tendered)
        ctx.addIssue({
          path: ['amountTendered'],
          code: 'custom',
          message: 'Amount is only allowed for cash payments!',
        });

      if (paymentMethod === PaymentMethod.TRANSFER && !paymentReference)
        ctx.addIssue({
          path: ['paymentReference'],
          code: 'custom',
          message: 'Payment reference is required for transfer payments!',
        });
      if (paymentMethod === PaymentMethod.CARD && !paymentReference)
        ctx.addIssue({
          path: ['paymentReference'],
          code: 'custom',
          message: 'Payment reference is required for card payments!',
        });
    }
  });

export const CreateOrderSchema = BaseOrderSchema;
export const UpdateOrderSchema = CreateOrderSchema;

export type OrderRelationParams = z.infer<typeof Relation>;
export type GetAllOrderParams = z.infer<typeof GetAllOrderSchema>;
export type CreateOrderInput = z.input<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.input<typeof UpdateOrderSchema>;
export type PosCheckoutForm = z.input<typeof PosCheckoutFormSchema>;
