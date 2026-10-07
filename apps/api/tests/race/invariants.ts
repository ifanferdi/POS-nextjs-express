import type { LedgerRow } from './client';

export type Verdict = 'pass' | 'fail' | 'skip';

export interface OrderLine {
  productId: number;
  quantity: number;
}

const verdict = (ok: boolean): Verdict => (ok ? 'pass' : 'fail');

export function successQtyByProduct(ledger: LedgerRow[]) {
  const byProduct: Record<number, number> = {};
  for (const row of ledger) {
    if (row.httpStatus !== 201) continue;
    const items = (row.payload as { items?: OrderLine[] })?.items ?? [];
    for (const item of items)
      byProduct[item.productId] = (byProduct[item.productId] ?? 0) + item.quantity;
  }
  return byProduct;
}

export function failureCounts(ledger: LedgerRow[]) {
  const counts: Record<string, number> = {};
  for (const row of ledger)
    if (row.category) counts[row.category] = (counts[row.category] ?? 0) + 1;
  return counts;
}

/** INV-1..5 for a CASH order scenario. */
export function summarizeInvariants(opts: {
  ledger: LedgerRow[];
  stockBefore: Record<number, number>;
  stockAfter: Record<number, number>;
  orderCount: number;
  paymentCount: number;
}): Record<string, Verdict> {
  const { ledger, stockBefore, stockAfter, orderCount, paymentCount } = opts;
  const success = ledger.filter((row) => row.httpStatus === 201);
  const qtyByProduct = successQtyByProduct(ledger);
  const unknown = ledger.filter((row) => row.category === 'unknown').length;

  const noOversell = Object.entries(qtyByProduct).every(
    ([id, qty]) => qty <= (stockBefore[Number(id)] ?? 0),
  );
  const conservation = Object.keys(stockBefore).every(
    (id) =>
      stockAfter[Number(id)] === (stockBefore[Number(id)] ?? 0) - (qtyByProduct[Number(id)] ?? 0),
  );
  const failureClean = orderCount === success.length && paymentCount === success.length;
  const conversion = success.length + (ledger.length - success.length) === ledger.length;

  return {
    'INV-1': verdict(noOversell),
    'INV-2': verdict(conservation),
    'INV-3': verdict(failureClean),
    'INV-4': verdict(conversion),
    'INV-5': verdict(unknown === 0),
  };
}

export function allPass(invariants: Record<string, Verdict>) {
  return Object.values(invariants).every((value) => value === 'pass');
}
