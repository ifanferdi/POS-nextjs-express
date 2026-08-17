import { OrderItem, Product } from '@/infrastructure/database/prisma/generated/client';
import { ProductScalarFieldEnum } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import { ICategory } from '@/domain/entities/models/category';

export interface IProduct extends Product {
  id: number;
  imageUrl?: string;
  productHasCategories?: IProductHasCategory[];
  categories?: ICategory[];
  orderItems?: OrderItem[];
}

export interface IProductHasCategory {
  productId: number;
  categoryId: number;
  product?: IProduct;
  category?: ICategory;
}

export const PRODUCT_FIELD = ProductScalarFieldEnum;
export type PRODUCT_FIELD = (typeof PRODUCT_FIELD)[keyof typeof PRODUCT_FIELD];
export const PRODUCT_FIELDS = Object.keys(PRODUCT_FIELD) as PRODUCT_FIELD[];
