import { ProductRelation } from '@/domain';
import {
  BasePagination,
  booleanSchema,
  nameSchema,
  numberSchema,
  optionalNumberSchema,
  optionalStringSchema,
  requiredStringSchema,
} from '@/lib/base.schema';
import { z } from 'zod';

const Relation = z.array(z.enum(ProductRelation)).optional();

export const GetAllProductSchema = BasePagination.extend({
  isActive: z.boolean().optional(),
  barcode: z
    .union([requiredStringSchema('barcode'), z.array(requiredStringSchema('barcode'))])
    .optional(),
  sku: z.union([requiredStringSchema('sku'), z.array(requiredStringSchema('sku'))]).optional(),
  categoryId: z.union([numberSchema, z.array(optionalNumberSchema)]).optional(),
  with: Relation,
  columns: z.array(z.string()).optional(),
});

const BaseProductSchema = z.object({
  name: nameSchema,
  description: optionalStringSchema,
  price: numberSchema,
  cost: optionalNumberSchema,
  sku: optionalStringSchema,
  barcode: optionalStringSchema,
  imagePath: optionalStringSchema,
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
