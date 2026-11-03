import { ProductDiscountCycleRelation } from '@/domain/entities/enums/product-discount-cycle.enum';
import { PRODUCT_DISCOUNT_CYCLE_FIELD } from '@/domain/entities/models/product-discount-cycle';
import { BaseFindById, BasePagination, NumberSchema } from '@/validations/base-validation';
import { z } from 'zod';

const Relations = z.array(z.nativeEnum(ProductDiscountCycleRelation).optional()).optional();
const columns = z.array(z.nativeEnum(PRODUCT_DISCOUNT_CYCLE_FIELD)).optional();

export const FindByIdProductDiscountCycleSchema = BaseFindById.extend({ with: Relations, columns });
export const FindAllProductDiscountCycleSchema = BasePagination(PRODUCT_DISCOUNT_CYCLE_FIELD)
  .extend({
    productId: z.union([NumberSchema, z.array(NumberSchema)]).optional(),
    from: z.coerce.date().optional(), // batas awal rentang (overlap)
    to: z.coerce.date().optional(), // batas akhir rentang (overlap)
    with: Relations,
  })
  .superRefine((data, ctx) => {
    if (data.ids && data.notId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ids and notId params cannot be used together!',
      });
    if (data.from && data.to && data.to < data.from)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['to'],
        message: 'To date harus setelah from date.',
      });
  });

const BaseProductDiscountCycleSchema = z.object({
  productId: NumberSchema,
  amount: NumberSchema.int().positive(),
  quota: NumberSchema.int().positive().nullish(), // null/absen = unlimited
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const CreateProductDiscountCycleSchema = BaseProductDiscountCycleSchema.superRefine(
  (data, ctx) => {
    if (data.endDate <= data.startDate)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date harus setelah start date.',
      });
  },
);

export const UpdateProductDiscountCycleSchema = BaseProductDiscountCycleSchema.extend({
  id: NumberSchema,
})
  .partial({ productId: true, amount: true, quota: true, startDate: true, endDate: true })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate <= data.startDate)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date harus setelah start date.',
      });
  });

export const CheckQuotaProductDiscountCycleSchema = z
  .array(
    z.object({
      productId: NumberSchema,
      quantity: NumberSchema.min(1),
    }),
  )
  .min(1);

export interface FindAllProductDiscountCycleDto extends z.infer<
  typeof FindAllProductDiscountCycleSchema
> {}
export interface FindByIdProductDiscountCycleDto extends z.infer<
  typeof FindByIdProductDiscountCycleSchema
> {}
export interface CreateProductDiscountCycleDto extends z.infer<
  typeof CreateProductDiscountCycleSchema
> {}
export interface UpdateProductDiscountCycleDto extends z.infer<
  typeof UpdateProductDiscountCycleSchema
> {}
export interface CheckQuotaProductDiscountCycleDto extends z.infer<
  typeof CheckQuotaProductDiscountCycleSchema
> {}
