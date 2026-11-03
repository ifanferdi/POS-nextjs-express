import { describe, expect, it } from 'bun:test';
import UpdateProductDiscountCycle from '../../src/use-cases/product-discount-cycle/update-product-discount-cycle';

const cycle = (startDate: Date, endDate: Date) => ({
  id: 1,
  productId: 1,
  amount: 1000,
  quota: 5,
  usedQty: 0,
  startDate,
  endDate,
});

const build = (existing: ReturnType<typeof cycle>) => {
  let updated = 0;
  const useCase = new UpdateProductDiscountCycle({
    productDiscountCycleRepository: {
      findOne: async () => existing,
      existsOverlap: async () => false,
      update: async () => {
        updated += 1;
        return existing;
      },
    },
    productRepository: { findOne: async () => ({ id: 1, price: 100_000 }) },
    redisRepository: { store: async () => {}, destroy: async () => {} },
  } as any);

  return { useCase, updatedCount: () => updated };
};

describe('update product discount cycle', () => {
  it('menolak edit cycle yang sedang aktif', async () => {
    const now = Date.now();
    const { useCase, updatedCount } = build(
      cycle(new Date(now - 3_600_000), new Date(now + 3_600_000)),
    );

    await expect(useCase.execute({ id: 1, amount: 500 })).rejects.toThrow(
      'Diskon yang sedang aktif tidak dapat diubah.',
    );
    expect(updatedCount()).toBe(0);
  });

  it('mengizinkan edit cycle yang belum mulai', async () => {
    const now = Date.now();
    const { useCase, updatedCount } = build(
      cycle(new Date(now + 3_600_000), new Date(now + 86_400_000)),
    );

    await useCase.execute({ id: 1, amount: 500 });
    expect(updatedCount()).toBe(1);
  });
});
