import { describe, expect, it } from 'bun:test';
import {
  effectiveUnitDiscount,
  isDiscountActive,
  isOverlapping,
  remainingQuota,
} from '../../src/helpers/discount.helper';

describe('discount calc', () => {
  it('clamp diskon per unit ke harga produk', () => {
    expect(effectiveUnitDiscount(30_000, 100_000)).toBe(30_000);
    expect(effectiveUnitDiscount(150_000, 100_000)).toBe(100_000);
    expect(effectiveUnitDiscount(100_000, 100_000)).toBe(100_000);
  });

  it('matematika order: subtotal gross, totalDiscount per unit * qty, total bersih', () => {
    const price = 100_000;
    const quantity = 2;
    const amount = 30_000;
    const take = 2;

    const subtotal = price * quantity;
    const totalDiscount = effectiveUnitDiscount(amount, price) * take;

    expect(subtotal).toBe(200_000);
    expect(totalDiscount).toBe(60_000);
    expect(subtotal - totalDiscount).toBe(140_000);
  });

  it('partial: sisa kuota 3, order 5 unit → diskon 3 unit saja', () => {
    const take = Math.min(5, 3);
    expect(effectiveUnitDiscount(10_000, 50_000) * take).toBe(30_000);
  });

  it('window diskon inklusif di kedua ujung', () => {
    const startDate = new Date('2026-10-01T00:00:00Z');
    const endDate = new Date('2026-10-31T00:00:00Z');

    expect(isDiscountActive({ startDate, endDate }, startDate)).toBe(true);
    expect(isDiscountActive({ startDate, endDate }, endDate)).toBe(true);
    expect(isDiscountActive({ startDate, endDate }, new Date('2026-09-30T23:59:59Z'))).toBe(false);
  });

  it('overlap: batas bersinggungan bukan overlap', () => {
    const at = (iso: string) => new Date(iso);

    expect(
      isOverlapping(at('2026-10-10'), at('2026-10-20'), at('2026-10-20'), at('2026-10-30')),
    ).toBe(false);
    expect(
      isOverlapping(at('2026-10-10'), at('2026-10-20'), at('2026-10-15'), at('2026-10-25')),
    ).toBe(true);
  });

  it('sisa kuota dari tabel: unlimited = null, tidak pernah negatif', () => {
    expect(remainingQuota({ quota: null, usedQty: 10 } as any)).toBeNull();
    expect(remainingQuota({ quota: 5, usedQty: 2 } as any)).toBe(3);
    expect(remainingQuota({ quota: 5, usedQty: 8 } as any)).toBe(0);
  });
});
