import { ProductDiscountCycleRelation } from '@/domain';
import { BasePagination, idSchema, numberSchema } from '@/lib/base.schema';
import { z } from 'zod';

const Relation = z.array(z.enum(ProductDiscountCycleRelation)).optional();

export const GetAllProductDiscountCycleSchema = BasePagination.extend({
  productId: numberSchema.optional(),
  /** ISO-8601; filter overlap: cycle.endDate >= from */
  from: z.string().optional(),
  /** ISO-8601; filter overlap: cycle.startDate <= to */
  to: z.string().optional(),
  with: Relation,
});

const DateRangeSchema = z
  .object({
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine((v) => new Date(v.endDate).getTime() > new Date(v.startDate).getTime(), {
    message: 'End date must be after start date.',
    path: ['endDate'],
  });

export const CreateProductDiscountCycleSchema = DateRangeSchema.and(
  z.object({
    productId: idSchema,
    amount: numberSchema.positive('Discount must be greater than 0'),
    quota: numberSchema.min(1, 'Quota must be at least 1').optional(),
  }),
);

export const UpdateProductDiscountCycleSchema = DateRangeSchema.and(
  z.object({
    amount: numberSchema.positive('Discount must be greater than 0'),
    quota: numberSchema.min(1, 'Quota must be at least 1').optional(),
  }),
);

export const CheckQuotaSchema = z
  .array(z.object({ productId: idSchema, quantity: numberSchema.min(1) }))
  .min(1);

export type GetAllProductDiscountCycleParams = z.infer<typeof GetAllProductDiscountCycleSchema>;
export type CreateProductDiscountCycleInput = z.input<typeof CreateProductDiscountCycleSchema>;
export type UpdateProductDiscountCycleInput = z.input<typeof UpdateProductDiscountCycleSchema>;
export type CheckQuotaInput = z.infer<typeof CheckQuotaSchema>;
export type ProductDiscountCycleRelationParams = z.infer<typeof Relation>;
