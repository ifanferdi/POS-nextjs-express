import { CategoryScalarFieldEnum } from '../../../infrastructure/database/prisma/generated/internal/prismaNamespace';
import { Category } from '../../../infrastructure/database/prisma/generated/client';
import { IProduct } from './product';

export interface ICategory extends Category {
  id: number;
  products?: IProduct[];
}

export const CATEGORY_FIELD = CategoryScalarFieldEnum;
export type CATEGORY_FIELD = (typeof CATEGORY_FIELD)[keyof typeof CATEGORY_FIELD];
export const CATEGORY_FIELDS = Object.keys(CATEGORY_FIELD) as CATEGORY_FIELD[];