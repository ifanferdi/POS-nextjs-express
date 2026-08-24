import { ProductRelation } from '@/domain/entities/enums/product.enum';
import { PRODUCT_FIELD } from '@/domain/entities/models/product';
import { SoftDeleteFields } from '@/domain/entities/types/database.types';
import {
  BaseFindById,
  BasePagination,
  NumberSchema,
  StringSchema,
} from '@/validations/base-validation';
import { z } from 'zod';

const Relations = z.array(z.nativeEnum(ProductRelation).optional()).optional();
const columns = z.array(z.nativeEnum(PRODUCT_FIELD)).optional();

export const FindByIdProductSchema = BaseFindById.extend({ with: Relations, columns });
export const FindAllProductSchema = BasePagination(PRODUCT_FIELD)
  .extend({
    isActive: z.boolean().optional(),
    barcode: z.union([StringSchema, z.array(StringSchema)]).optional(),
    sku: z.union([StringSchema, z.array(StringSchema)]).optional(),
    categoryId: z.union([NumberSchema, z.array(NumberSchema)]).optional(),
    with: Relations,
  })
  .superRefine((data, ctx) => {
    if (data.ids && data.notId)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ids and notId params cannot be used together!',
      });
  });
export const CreateProductSchema = z.object({
  name: StringSchema.min(1, 'Name cannot be empty.').max(255),
  description: StringSchema.optional(),
  price: NumberSchema,
  cost: NumberSchema.optional(),
  sku: StringSchema.max(100).optional(),
  barcode: StringSchema.max(100).optional(),
  imagePath: StringSchema.optional(),
  isActive: z.boolean().optional().default(true),
  stock: NumberSchema.optional().default(0),
  categoryIds: z.array(NumberSchema).optional(),
});
export const UpdateProductSchema = CreateProductSchema.extend({
  id: NumberSchema,
}).partial({ name: true, price: true });

export interface FindAllProductDto extends z.infer<typeof FindAllProductSchema>, SoftDeleteFields {}
export interface FindByIdProductDto extends z.infer<typeof FindByIdProductSchema> {}
export interface CreateProductDto extends z.infer<typeof CreateProductSchema> {}
export interface UpdateProductDto extends z.infer<typeof UpdateProductSchema> {}
