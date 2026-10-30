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

export interface ProductList extends Product {
  categories: Category[];
}

export type ProductsTableDto = Pick<
  ProductList,
  'id' | 'name' | 'sku' | 'stock' | 'price' | 'isActive'
> & {
  categories: Array<Pick<Category, 'id' | 'name'>>;
};

export type ProductDetail = ProductList;

export enum ProductRelation {
  CATEGORIES = 'categories',
  SOFT_DELETE = 'soft-delete',
}
