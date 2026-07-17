import { z } from 'zod';
import { ProductCategoryRelation } from '../domain/entities/enums/product-category.enum';
import { PRODUCT_CATEGORY_FIELD } from '../domain/entities/models/product-category';
import { BaseFindById, BasePagination, StringSchema } from './base-validation';

const Relations = z.array(z.nativeEnum(ProductCategoryRelation).optional()).optional();
const columns = z.array(z.nativeEnum(PRODUCT_CATEGORY_FIELD)).optional();

export const FindByIdProductCategorySchema = BaseFindById.extend({
  with: Relations,
  columns,
});
export const FindAllProductCategorySchema = BasePagination(PRODUCT_CATEGORY_FIELD).extend({
  with: Relations,
});
export const CreateProductCategorySchema = z.object({
  name: StringSchema.max(255),
  description: StringSchema.optional(),
});
export const UpdateProductCategorySchema = CreateProductCategorySchema.extend({
  id: z.number(),
});

export interface FindAllProductCategoryDto
  extends z.infer<typeof FindAllProductCategorySchema> {}
export interface FindByIdProductCategoryDto
  extends z.infer<typeof FindByIdProductCategorySchema> {}
export interface CreateProductCategoryDto
  extends z.infer<typeof CreateProductCategorySchema> {}
export interface UpdateProductCategoryDto
  extends z.infer<typeof UpdateProductCategorySchema> {}
