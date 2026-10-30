import _ from 'lodash';
import moment from 'moment';
import { unstable_rethrow } from 'next/navigation';

export const stringEllipsis = (str: string, length = 30) =>
  _.truncate(str, { length, separator: '' });
export const calculateAge = (dateOfBirth: Date) => moment().diff(moment(dateOfBirth), 'years');
export const formatDate = (date: Date) => moment(date).format('YYYY-MM-DD');
export const formatDateTime = (date: Date) => moment(date).format('YYYY-MM-DD hh:mm:ss');
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