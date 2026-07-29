import { ProductRelation } from '@/domain';
import {
  BasePagination,
  booleanSchema,
  numberSchema,
  optionalNumberSchema,
  optionalStringSchema,
  stringSchema,
} from '@/lib/base.schema';
import { z } from 'zod';

const Relation = z.array(z.enum(ProductRelation)).optional();

export const GetAllProductSchema = BasePagination.extend({
  isActive: z.boolean().optional(),
  barcode: z.union([stringSchema, z.array(stringSchema)]).optional(),
  sku: z.union([stringSchema, z.array(stringSchema)]).optional(),
  categoryId: z.union([numberSchema, z.array(optionalNumberSchema)]).optional(),
  with: Relation,
});

const BaseProductSchema = z.object({
  name: stringSchema,
  description: optionalStringSchema.nullable(),
  price: numberSchema,
  cost: optionalNumberSchema.nullable(),
  sku: optionalStringSchema.nullable(),
  barcode: optionalStringSchema.nullable(),
  imagePath: optionalStringSchema.nullable(),
  isActive: booleanSchema,
  stock: numberSchema,
  categoryIds: z.array(numberSchema).min(1),
});

export const CreateProductSchema = BaseProductSchema;
export const UpdateProductSchema = CreateProductSchema;

export type ProductRelationParams = z.infer<typeof Relation>;
export type GetAllProductParams = z.infer<typeof GetAllProductSchema>;
export type CreateProductInput = z.input<typeof CreateProductSchema>;
export type UpdateProductInput = z.input<typeof UpdateProductSchema>;
