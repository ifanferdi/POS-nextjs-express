import { describe, expect, it } from 'bun:test';
import { ProductRelation } from '../../src/domain/entities/enums/product.enum';
import FindAllProduct from '../../src/use-cases/product/find-all-product';
import FindByIdProduct from '../../src/use-cases/product/find-by-id-product';

const product = { id: 1, name: 'Kopi', price: 20000, isActive: true } as any;

// findActive() mengurutkan startDate desc, jadi index 0 = diskon terbaru.
const latest = { id: 2, productId: 1, amount: 5000, quota: null, usedQty: 0 } as any;
const older = { id: 1, productId: 1, amount: 2000, quota: null, usedQty: 0 } as any;

const makeRepositories = (discounts: any[] = [latest, older]) => {
  let findActiveCalls = 0;

  return {
    findActiveCalls: () => findActiveCalls,
    repositories: {
      productRepository: {
        findAll: async () => [structuredClone(product)],
        findOne: async () => structuredClone(product),
        count: async () => 1,
      },
      productDiscountCycleRepository: {
        findActive: async () => {
          findActiveCalls++;
          return discounts;
        },
      },
      storageRepository: { getUrl: async (path: string) => path },
    } as any,
  };
};

describe('product discount relation', () => {
  it('find-all tanpa with[]: tanpa data diskon & tanpa query diskon', async () => {
    const { repositories, findActiveCalls } = makeRepositories();

    const result = await new FindAllProduct(repositories).execute({ page: 1, limit: 10 });

    expect(findActiveCalls()).toBe(0);
    expect(result.data[0].discount).toBeUndefined();
    expect(result.data[0].finalPrice).toBeUndefined();
  });

  it('find-all dengan with[]: diskon terbaru masuk ke discount, finalPrice ada di dalamnya', async () => {
    const { repositories } = makeRepositories();

    const result = await new FindAllProduct(repositories).execute({
      page: 1,
      limit: 10,
      with: [ProductRelation.DISCOUNT_CYCLES],
    });

    expect(result.data[0].discount.id).toBe(latest.id);
    expect(result.data[0].discount.remainingQuota).toBeNull();
    expect(result.data[0].discount.finalPrice).toBe(product.price - latest.amount);
  });

  it('kuota habis: discount tetap ada dengan remainingQuota 0, finalPrice = price', async () => {
    const { repositories } = makeRepositories([{ ...latest, quota: 2, usedQty: 2 }]);

    const result = await new FindAllProduct(repositories).execute({
      page: 1,
      limit: 10,
      with: [ProductRelation.DISCOUNT_CYCLES],
    });

    expect(result.data[0].discount.remainingQuota).toBe(0);
    expect(result.data[0].discount.finalPrice).toBe(product.price);
  });

  it('find-by-id tanpa with[]: tanpa data diskon', async () => {
    const { repositories, findActiveCalls } = makeRepositories();

    const result = await new FindByIdProduct(repositories).execute({ id: 1 });

    expect(findActiveCalls()).toBe(0);
    expect(result.discount).toBeUndefined();
    expect(result.finalPrice).toBeUndefined();
  });

  it('find-by-id dengan with[]: diskon terbaru masuk ke discount', async () => {
    const { repositories } = makeRepositories();

    const result = await new FindByIdProduct(repositories).execute({
      id: 1,
      with: [ProductRelation.DISCOUNT_CYCLES],
    });

    expect(result.discount.id).toBe(latest.id);
    expect(result.discount.finalPrice).toBe(product.price - latest.amount);
  });
});
