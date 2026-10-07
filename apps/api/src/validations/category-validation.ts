import { CategoryRelation } from '@/domain/entities/enums/category.enum';
import { CATEGORY_FIELD } from '@/domain/entities/models/category';
import {
  BaseFindById,
  BasePagination,
  NumberSchema,
  StringSchema,
} from '@/validations/base-validation';
import { z } from 'zod';

const Relations = z.array(z.nativeEnum(CategoryRelation).optional()).optional();
const columns = z.array(z.nativeEnum(CATEGORY_FIELD)).optional();

export const FindByIdCategorySchema = BaseFindById.extend({
  with: Relations,
  columns,
});
export const FindAllCategorySchema = BasePagination(CATEGORY_FIELD).extend({
  productId: z.union([NumberSchema, z.array(NumberSchema)]).optional(),
  name: StringSchema.optional(),
  with: Relations,
});
export const CreateCategorySchema = z.object({
  name: StringSchema.min(1, 'Name cannot be empty.').max(255),
  description: StringSchema.optional(),
});
export const UpdateCategorySchema = CreateCategorySchema.extend({
  id: z.number(),
});

export interface FindAllCategoryDto extends z.infer<typeof FindAllCategorySchema> {}
export interface FindByIdCategoryDto extends z.infer<typeof FindByIdCategorySchema> {}
export interface CreateCategoryDto extends z.infer<typeof CreateCategorySchema> {}
export interface UpdateCategoryDto extends z.infer<typeof UpdateCategorySchema> {}
