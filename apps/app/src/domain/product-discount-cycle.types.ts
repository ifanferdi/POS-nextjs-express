import type { Product } from '@/domain/product.types';

export interface ProductDiscountCycle {
  id: number;
  productId: number;
  amount: number;
  quota: number | null;
  usedQty: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDiscountCycleList extends ProductDiscountCycle {
  product?: Product;
}

/** Cycle aktif yang menempel di response product saat `with[]=discount-cycles`. */
export interface ProductDiscount extends ProductDiscountCycle {
  /** Sisa unit berdiskon; null = tanpa batas, 0 = kuota habis. */
  remainingQuota: number | null;
  /** Harga akhir setelah diskon; sama dengan `price` bila kuota habis. */
  finalPrice: number;
}

export enum ProductDiscountCycleRelation {
  PRODUCT = 'product',
}

export enum DiscountCycleStatus {
  ACTIVE = 'active',
  SCHEDULED = 'scheduled',
  EXPIRED = 'expired',
  QUOTA_EXHAUSTED = 'quota-exhausted',
}

export interface DiscountQuotaShortage {
  productId: number;
  itemLeft: number;
}
