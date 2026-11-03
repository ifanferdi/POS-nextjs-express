import _ from 'lodash';
import moment from 'moment';
import { unstable_rethrow } from 'next/navigation';

export const stringEllipsis = (str: string, length = 30) =>
  _.truncate(str, { length, separator: '' });
export const calculateAge = (dateOfBirth: Date) => moment().diff(moment(dateOfBirth), 'years');
export const formatDate = (date: Date | string) => moment(date).format('MMM D, YYYY');
export const formatDateTime = (date: Date | string) => moment(date).format('MMM D, YYYY HH:mm');
export const formatDateISO = (date: Date | string) => moment(date).format('YYYY-MM-DD');
export const formatCurrency = (n: number, decimalDigits = 2) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: decimalDigits,
  }).format(n);
export const formatCompactCurrency = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);

/** Persen potongan untuk badge diskon. 0 bila data tidak masuk akal. */
export const getDiscountPercentage = (price: number, amount: number) =>
  price > 0 && amount > 0 ? Math.round((amount / price) * 100) : 0;

/** Diskon yang masih berlaku; kuota habis dianggap tidak ada promo. */
export function getActiveDiscount<T extends { remainingQuota: number | null }>(
  discount?: T | null,
): T | null {
  if (!discount || discount.remainingQuota === 0) return null;
  return discount;
}

export interface OrderItemSplit {
  discountedQty: number;
  regularQty: number;
  unitPrice: number;
  discountAmount: number;
  /** Nilai bayar item setelah diskon. */
  total: number;
}

/** Pisahkan satu order item menjadi porsi berdiskon dan harga normal. */
export function splitOrderItem(item: {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  meta: {
    product?: { price?: number };
    discountAmount?: number;
    discountQty?: number;
  } | null;
}): OrderItemSplit {
  const discountedQty = Math.min(Math.max(item.meta?.discountQty ?? 0, 0), item.quantity);
  const discountAmount = discountedQty > 0 ? (item.meta?.discountAmount ?? 0) : 0;

  return {
    discountedQty,
    regularQty: item.quantity - discountedQty,
    unitPrice: item.meta?.product?.price ?? item.unitPrice,
    discountAmount,
    total: item.totalPrice - discountAmount,
  };
}

/** YYYY-MM-DD dari Date di timezone tertentu (bukan timezone server). */
export const formatDateInTimezone = (date: Date, timeZone: string) =>
  date.toLocaleDateString('en-CA', { timeZone });

/** Range `days` hari terakhir sampai hari ini di `timeZone`. */
export const getDefaultDateRange = (timeZone: string, days = 30) => {
  const to = formatDateInTimezone(new Date(), timeZone);
  return {
    to,
    from: moment(to)
      .subtract(days - 1, 'days')
      .format('YYYY-MM-DD'),
  };
};
export const defaultPaginatedResponse = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  data: [],
};

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function buildPageItems(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  if (current >= totalPages - 3) {
    return [
      1,
      'ellipsis',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', totalPages];
}

/**
 * Hitung pembulatan ke kelipatan terdekat (default: 100)
 * Contoh: 20.921 → { rounding: 79, total: 21.000 }
 */
export function calculateRounding(
  subtotal: number,
  roundTo: number = 100,
): { rounding: number; total: number } {
  const total = Math.ceil(subtotal / roundTo) * roundTo;
  const rounding = total - subtotal;

  return {
    rounding: Number(rounding.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

export async function guard<T>(
  call: () => Promise<T>,
  errorMessage = 'Failed to load dashboard data.',
): Promise<T> {
  try {
    return await call();
  } catch (error) {
    unstable_rethrow(error);
    throw error instanceof Error ? error : new Error(errorMessage);
  }
}

export function coerceEnum<T extends string>(
  value: string | undefined,
  values: readonly T[],
): T | undefined {
  return value && (values as readonly string[]).includes(value) ? (value as T) : undefined;
}
