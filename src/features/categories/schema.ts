import { CategoryRelation } from '@/domain';
import {
  BasePagination,
  numberSchema,
  optionalNumberSchema,
  stringSchema,
} from '@/lib/base.schema';
import { z } from 'zod';

const Relation = z.array(z.enum(CategoryRelation)).optional();

export const GetAllCategorySchema = BasePagination.extend({
  productId: z.union([numberSchema, z.array(optionalNumberSchema)]).optional(),
  with: Relation,
});

const BaseCategorySchema = z.object({
  name: stringSchema.max(255),
  description: stringSchema.max(1000).optional(),
});

export const CreateCategorySchema = BaseCategorySchema;
export const UpdateCategorySchema = CreateCategorySchema;

export type CategoryRelationParams = z.infer<typeof Relation>;
export type GetAllCategoryParams = z.input<typeof GetAllCategorySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
