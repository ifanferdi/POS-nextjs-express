import { describe, expect, it } from 'bun:test';
import { PaymentMethod } from '../../src/domain/entities/enums/payment.enum';
import { redisRemainingKey, selectItemDiscount } from '../../src/helpers/discount.helper';
import CheckQuotaProductDiscountCycle from '../../src/use-cases/product-discount-cycle/check-quota-product-discount-cycle';
import { CreateOrderSchema } from '../../src/validations/order-validation';

const cycle = (overrides: Record<string, any> = {}) =>
  ({
    id: 10,
    productId: 1,
    amount: 1000,
    quota: 5,
    usedQty: 0,
    startDate: new Date('2026-11-01T00:00:00Z'),
    endDate: new Date('2026-11-30T00:00:00Z'),
    ...overrides,
  }) as any;

const build = (cycles: any[], remaining: Record<string, number | null> = {}) => {
  const stored: Array<{ key: string; value: string }> = [];

  const useCase = new CheckQuotaProductDiscountCycle({
    productDiscountCycleRepository: { findActive: async () => cycles },
    redisRepository: {
      getRemaining: async (key: string) => remaining[key] ?? null,
      store: async ({ key, value }: { key: string; value: string }) => {
        stored.push({ key, value });
      },
    },
  } as any);

  return { useCase, stored };
};

describe('check-quota product discount cycle', () => {
  it('produk tanpa cycle aktif → invalid dengan itemLeft 0', async () => {
    const { useCase } = build([]);
    expect(await useCase.execute([{ productId: 1, quantity: 1 }])).toEqual({
      valid: false,
      invalid: [{ productId: 1, itemLeft: 0 }],
    });
  });

  it('quota null (unlimited) → selalu valid', async () => {
    const { useCase } = build([cycle({ quota: null })]);
    expect(await useCase.execute([{ productId: 1, quantity: 999 }])).toEqual({ valid: true });
  });

  it('sisa >= qty → valid; sisa < qty → invalid dengan itemLeft aktual', async () => {
    const discount = cycle();
    const key = redisRemainingKey(discount.id);

    const enough = build([discount], { [key]: 5 });
    expect(await enough.useCase.execute([{ productId: 1, quantity: 5 }])).toEqual({ valid: true });

    const notEnough = build([discount], { [key]: 3 });
    expect(await notEnough.useCase.execute([{ productId: 1, quantity: 5 }])).toEqual({
      valid: false,
      invalid: [{ productId: 1, itemLeft: 3 }],
    });
  });

  it('produk sama >1 entry → qty dijumlahkan', async () => {
    const discount = cycle();
    const key = redisRemainingKey(discount.id);
    const { useCase } = build([discount], { [key]: 5 });

    expect(
      await useCase.execute([
        { productId: 1, quantity: 4 },
        { productId: 1, quantity: 3 },
      ]),
    ).toEqual({ valid: false, invalid: [{ productId: 1, itemLeft: 5 }] });
  });

  it('key Redis miss → rebuild dari quota - usedQty', async () => {
    const discount = cycle({ quota: 5, usedQty: 0 });
    const { useCase, stored } = build([discount]);

    expect(await useCase.execute([{ productId: 1, quantity: 6 }])).toEqual({
      valid: false,
      invalid: [{ productId: 1, itemLeft: 5 }],
    });
    expect(stored).toEqual([{ key: redisRemainingKey(discount.id), value: '5' }]);
    expect(discount.usedQty).toBe(0); // read-only, tidak mengubah usedQty
  });
});

describe('useDiscount flag', () => {
  const discount = cycle();

  it('field tidak dikirim → default false', () => {
    const parsed = CreateOrderSchema.parse({
      userId: 1,
      idempotencyKey: crypto.randomUUID(),
      paymentMethod: PaymentMethod.CASH,
      amount: 100_000,
      items: [{ productId: 1, quantity: 1 }],
    });

    expect(parsed.items[0].useDiscount).toBe(false);
  });

  it('false / tidak dikirim → row harga normal (tidak claim kuota)', () => {
    expect(selectItemDiscount(false, discount)).toBeUndefined();
    expect(selectItemDiscount(undefined, discount)).toBeUndefined();
  });

  it('true → row memakai diskon', () => {
    expect(selectItemDiscount(true, discount)).toBe(discount);
  });
});
