import { Category, Product } from '@/infrastructure/database/prisma/generated/client';
import { ProductScalarFieldEnum } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';

export interface IProduct extends Product {
  imageUrl?: string ;
}

export interface ProductCategories extends IProduct {
  productHasCategories: Array<{ category: Category }>;
  categories?: Category[];
}

export const PRODUCT_FIELD = ProductScalarFieldEnum;
export type PRODUCT_FIELD = (typeof PRODUCT_FIELD)[keyof typeof PRODUCT_FIELD];
export const PRODUCT_FIELDS = Object.keys(PRODUCT_FIELD) as PRODUCT_FIELD[];
