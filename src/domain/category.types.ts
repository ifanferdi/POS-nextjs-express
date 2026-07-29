import { Product } from './product.types';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  products?: Product[];
}

export enum CategoryRelation {
  PROFILE = 'profile',
  ROLE = 'role',
  ROLE_PERMISSIONS = 'role.permissions',
  PERMISSIONS = 'permissions',
  SOFT_DELETE = 'soft-delete',
}
export type CategoryOption = Pick<Category, 'id' | 'name'>;
