import { Category } from '@/domain/category.types';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  sku: string | null;
  barcode: string | null;
  imagePath: string | null;
  imageUrl: string | null;
  isActive: boolean;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ProductDetail extends Product {
  categories: Category[];
}

export interface ProductList extends Product {
  categories: Category[];
}

export enum ProductRelation {
  CATEGORIES = 'categories',
  SOFT_DELETE = 'soft-delete',
}
