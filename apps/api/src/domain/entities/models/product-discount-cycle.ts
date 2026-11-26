import { ProductDiscountCycleScalarFieldEnum } from '@/infrastructure/database/prisma/generated/internal/prismaNamespace';

export const PRODUCT_DISCOUNT_CYCLE_FIELD = ProductDiscountCycleScalarFieldEnum;
export type PRODUCT_DISCOUNT_CYCLE_FIELD =
  (typeof PRODUCT_DISCOUNT_CYCLE_FIELD)[keyof typeof PRODUCT_DISCOUNT_CYCLE_FIELD];
export const PRODUCT_DISCOUNT_CYCLE_FIELDS = Object.keys(
  PRODUCT_DISCOUNT_CYCLE_FIELD,
) as PRODUCT_DISCOUNT_CYCLE_FIELD[];
