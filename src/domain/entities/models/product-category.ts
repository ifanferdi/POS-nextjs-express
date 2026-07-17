import { ProductCategoryScalarFieldEnum } from '../../../infrastructure/database/prisma/generated/internal/prismaNamespace';
import { ProductCategory } from '../../../infrastructure/database/prisma/generated/client';
import { IProduct } from './product';

export interface IProductCategory extends ProductCategory {
  id: number;
  products?: IProduct[];
}

export const PRODUCT_CATEGORY_FIELD = ProductCategoryScalarFieldEnum;
export type PRODUCT_CATEGORY_FIELD =
  (typeof PRODUCT_CATEGORY_FIELD)[keyof typeof PRODUCT_CATEGORY_FIELD];
export const PRODUCT_CATEGORY_FIELDS = Object.keys(
  PRODUCT_CATEGORY_FIELD,
) as PRODUCT_CATEGORY_FIELD[];
