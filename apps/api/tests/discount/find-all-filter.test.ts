import { describe, expect, it } from 'bun:test';
import QueryProductDiscountCycleRepository from '../../src/repositories/database/queries/query-product-discount-cycle-repository';
import { FindAllProductDiscountCycleSchema } from '../../src/validations/product-discount-cycle-validation';

describe('find all product discount cycle filter', () => {
  it('from/to menjadi filter overlap (endDate >= from, startDate <= to)', () => {
    const from = new Date('2026-11-01T00:00:00Z');
    const to = new Date('2026-11-30T23:59:59Z');

    const where = new QueryProductDiscountCycleRepository().handleWhere({ from, to });

    expect(where).toEqual({ endDate: { gte: from }, startDate: { lte: to } });
  });

  it('hanya from atau hanya to tetap valid', () => {
    const from = new Date('2026-11-01T00:00:00Z');
    const to = new Date('2026-11-30T23:59:59Z');

    expect(new QueryProductDiscountCycleRepository().handleWhere({ from })).toEqual({
      endDate: { gte: from },
    });
    expect(new QueryProductDiscountCycleRepository().handleWhere({ to })).toEqual({
      startDate: { lte: to },
    });
  });

  it('schema menolak to sebelum from', () => {
    expect(() =>
      FindAllProductDiscountCycleSchema.parse({ from: '2026-11-30', to: '2026-11-01' }),
    ).toThrow('To date harus setelah from date.');
  });

  it('schema mengubah from/to string menjadi Date', () => {
    const parsed = FindAllProductDiscountCycleSchema.parse({
      from: '2026-11-01',
      to: '2026-11-30',
    });

    expect(parsed.from).toBeInstanceOf(Date);
    expect(parsed.to).toBeInstanceOf(Date);
  });
});
