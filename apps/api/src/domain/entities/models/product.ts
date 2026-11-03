import { Category, Product } from '@/infrastructure/database/prisma/generated/client';
import { ProductScalarFieldEnum } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';
import { MetaDiscountCycle } from './order';

export interface ProductDiscount extends MetaDiscountCycle {
  remainingQuota: number | null;
  finalPrice: number;
}

export interface IProduct extends Product {
  imageUrl?: string;
  // Diisi hanya saat `with[]=discount-cycles`: semua data diskon aktif terbaru (maks. 1).
  discount?: ProductDiscount | null;
}

export interface ProductCategories extends IProduct {
  productHasCategories: Array<{ category: Category }>;
  categories?: Category[];
}

export const PRODUCT_FIELD = ProductScalarFieldEnum;
export type PRODUCT_FIELD = (typeof PRODUCT_FIELD)[keyof typeof PRODUCT_FIELD];
export const PRODUCT_FIELDS = Object.keys(PRODUCT_FIELD) as PRODUCT_FIELD[];
