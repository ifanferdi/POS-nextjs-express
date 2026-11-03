import { ProductDiscountCycle } from '@/infrastructure/database/prisma/generated/client';
import type RedisRepository from '@/repositories/redis/redis-repository';

export const effectiveUnitDiscount = (amount: number, price: number) => Math.min(amount, price);

export const isDiscountActive = (date: { startDate: Date; endDate: Date }, at: Date) =>
  date.startDate <= at && at <= date.endDate;

// useDiscount default false → row tanpa flag dianggap harga normal (opt-in).
export const selectItemDiscount = <T>(useDiscount: boolean | undefined, discount?: T) =>
  useDiscount === true ? discount : undefined;

// Batas bersinggungan bukan overlap: [10–20] dan [20–30] tidak bentrok.
export const isOverlapping = (startA: Date, endA: Date, startB: Date, endB: Date) =>
  startA < endB && endA > startB;

// Truth sisa kuota ada di tabel; Redis hanya counter cepat yang bisa di-rebuild dari sini.
export const remainingQuota = (d: Pick<ProductDiscountCycle, 'quota' | 'usedQty'>) =>
  d.quota == null ? null : Math.max(d.quota - d.usedQty, 0);

export const redisRemainingKey = (discountId: number) =>
  `product-discount-cycle:remaining:${discountId}`;

export const discountTtlSeconds = (endDate: Date) =>
  Math.max(Math.floor((endDate.getTime() - Date.now()) / 1000), 0) + 86_400;

/**
 * Pastikan counter sisa kuota ada di Redis (rebuild dari tabel saat key miss).
 * Satu sumber logika rebuild untuk claim order & endpoint check-quota.
 */
export async function ensureRemainingCounter(
  discount: ProductDiscountCycle,
  redisRepository: RedisRepository,
) {
  if (discount.quota == null) return null;

  const key = redisRemainingKey(discount.id);
  const cached = await redisRepository.getRemaining(key);
  if (cached !== null) return cached;

  // shortcut: dua proses rebuild bersamaan bisa kehilangan 1x claim — hanya pasca Redis flush.
  const remaining = remainingQuota(discount) ?? 0;
  await redisRepository.store({
    key,
    value: String(remaining),
    expired: discountTtlSeconds(discount.endDate),
    logging: false,
  });

  return remaining;
}
