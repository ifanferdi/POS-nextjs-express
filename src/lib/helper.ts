import moment from 'moment';

export const calculateAge = (dateOfBirth: Date) => moment().diff(moment(dateOfBirth), 'years');
export const formatDate = (date: Date) => moment(date).format('YYYY-MM-DD');
export const formatCurrency = (n: number, decimalDigits = 2) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: decimalDigits,
  }).format(n);

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
