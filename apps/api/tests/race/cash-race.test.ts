import { PaymentMethod } from '@/domain/entities/enums/payment.enum';
import { afterAll, describe, expect, it, setDefaultTimeout } from 'bun:test';
import { fireConcurrent, fireRamped } from './barrier';
import { postOrder } from './client';
import {
  countOrders,
  countPayments,
  getStocks,
  loginAll,
  resetAll,
  seedBase,
  seedProduct,
} from './fixtures';
import { allPass, failureCounts, summarizeInvariants } from './invariants';
import { ScenarioResult, writeReport } from './report';

interface ProductSpec {
  name: string;
  stock: number;
  price?: number;
}

const results: ScenarioResult[] = [];
setDefaultTimeout(180_000);

afterAll(() => {
  if (results.length) writeReport(results, { suite: 'cash', scenarios: results.length });
});

async function setup(products: ProductSpec[]) {
  await resetAll();
  await seedBase();
  const ids: number[] = [];
  for (const product of products)
    ids.push(await seedProduct(product.name, product.stock, product.price));
  const sessions = await loginAll();
  return { ids, sessions };
}

const cashPayload = (items: { productId: number; quantity: number }[]) => ({
  items,
  paymentMethod: PaymentMethod.CASH,
  amount: 1_000_000,
});

describe('CASH race scenarios', () => {
  it('S1: stock=1, 10 buyers qty=1 -> 1 success', async () => {
    const { ids, sessions } = await setup([{ name: 'S1', stock: 1 }]);
    const stockBefore = await getStocks(ids);
    const ledger = await fireConcurrent(10, (i) =>
      postOrder({
        token: sessions[i % sessions.length].token,
        userId: sessions[i % sessions.length].userId,
        seq: i,
        scenario: 'S1',
        payload: cashPayload([{ productId: ids[0], quantity: 1 }]),
      }),
    );
    const stockAfter = await getStocks(ids);
    const orderCount = await countOrders();
    const paymentCount = await countPayments();
    const invariants = summarizeInvariants({
      ledger,
      stockBefore,
      stockAfter,
      orderCount,
      paymentCount,
    });

    expect(stockAfter[ids[0]]).toBe(0);
    expect(ledger.filter((row) => row.httpStatus === 201)).toHaveLength(1);
    expect(allPass(invariants)).toBe(true);

    results.push({
      name: 'S1',
      params: { stockBefore },
      totalRequests: ledger.length,
      successCount: orderCount,
      failedByCategory: failureCounts(ledger),
      invariants,
      dbState: { stockAfter, orderCount, paymentCount },
      ledger,
    });
  });

  it('S2: stock=10, 50 buyers qty=1 -> 10 success, stock=0', async () => {
    const { ids, sessions } = await setup([{ name: 'S2', stock: 10 }]);
    const stockBefore = await getStocks(ids);
    const ledger = await fireConcurrent(50, (i) =>
      postOrder({
        token: sessions[i % sessions.length].token,
        userId: sessions[i % sessions.length].userId,
        seq: i,
        scenario: 'S2',
        payload: cashPayload([{ productId: ids[0], quantity: 1 }]),
      }),
    );
    const stockAfter = await getStocks(ids);
    const orderCount = await countOrders();
    const paymentCount = await countPayments();
    const invariants = summarizeInvariants({
      ledger,
      stockBefore,
      stockAfter,
      orderCount,
      paymentCount,
    });

    expect(stockAfter[ids[0]]).toBe(0);
    expect(allPass(invariants)).toBe(true);

    results.push({
      name: 'S2',
      params: { stockBefore },
      totalRequests: ledger.length,
      successCount: orderCount,
      failedByCategory: failureCounts(ledger),
      invariants,
      dbState: { stockAfter, orderCount, paymentCount },
      ledger,
    });
  });

  it('S3: stock=10, 20 buyers qty=3 -> 3 success, stock=1', async () => {
    const { ids, sessions } = await setup([{ name: 'S3', stock: 10 }]);
    const stockBefore = await getStocks(ids);
    const ledger = await fireConcurrent(20, (i) =>
      postOrder({
        token: sessions[i % sessions.length].token,
        userId: sessions[i % sessions.length].userId,
        seq: i,
        scenario: 'S3',
        payload: cashPayload([{ productId: ids[0], quantity: 3 }]),
      }),
    );
    const stockAfter = await getStocks(ids);
    const orderCount = await countOrders();
    const paymentCount = await countPayments();
    const invariants = summarizeInvariants({
      ledger,
      stockBefore,
      stockAfter,
      orderCount,
      paymentCount,
    });

    expect(stockAfter[ids[0]]).toBe(1);
    expect(ledger.filter((row) => row.httpStatus === 201)).toHaveLength(3);
    expect(allPass(invariants)).toBe(true);

    results.push({
      name: 'S3',
      params: { stockBefore },
      totalRequests: ledger.length,
      successCount: orderCount,
      failedByCategory: failureCounts(ledger),
      invariants,
      dbState: { stockAfter, orderCount, paymentCount },
      ledger,
    });
  });

  it('S4: A(5)+B(5), 30 mixed-order carts -> no oversell, no deadlock', async () => {
    const { ids, sessions } = await setup([
      { name: 'S4-A', stock: 5 },
      { name: 'S4-B', stock: 5 },
    ]);
    const [a, b] = ids;
    const stockBefore = await getStocks(ids);
    const ledger = await fireConcurrent(30, (i) => {
      const items =
        i % 2 === 0
          ? [
              { productId: a, quantity: 1 },
              { productId: b, quantity: 1 },
            ]
          : [
              { productId: b, quantity: 1 },
              { productId: a, quantity: 1 },
            ];
      return postOrder({
        token: sessions[i % sessions.length].token,
        userId: sessions[i % sessions.length].userId,
        seq: i,
        scenario: 'S4',
        payload: cashPayload(items),
      });
    });
    const stockAfter = await getStocks(ids);
    const orderCount = await countOrders();
    const paymentCount = await countPayments();
    const invariants = summarizeInvariants({
      ledger,
      stockBefore,
      stockAfter,
      orderCount,
      paymentCount,
    });
    const deadlocks = ledger.filter((row) => row.category === 'deadlock').length;

    expect(deadlocks).toBe(0);
    expect(allPass(invariants)).toBe(true);

    results.push({
      name: 'S4',
      params: { stockBefore },
      totalRequests: ledger.length,
      successCount: orderCount,
      failedByCategory: failureCounts(ledger),
      invariants,
      dbState: { stockAfter, orderCount, paymentCount, deadlocks },
      ledger,
    });
  });

  it('S5: 3 products, 200 requests ramped 0-3000ms', async () => {
    const { ids, sessions } = await setup([
      { name: 'S5-A', stock: 30 },
      { name: 'S5-B', stock: 30 },
      { name: 'S5-C', stock: 30 },
    ]);
    const stockBefore = await getStocks(ids);
    const startedAt = Date.now();
    const ledger = await fireRamped(200, 3000, (i) => {
      const session = sessions[Math.floor(Math.random() * sessions.length)];
      const productId = ids[Math.floor(Math.random() * ids.length)];
      const quantity = 1 + Math.floor(Math.random() * 3);
      return postOrder({
        token: session.token,
        userId: session.userId,
        seq: i,
        scenario: 'S5',
        payload: cashPayload([{ productId, quantity }]),
      });
    });
    const elapsedMs = Date.now() - startedAt;
    const stockAfter = await getStocks(ids);
    const orderCount = await countOrders();
    const paymentCount = await countPayments();
    const invariants = summarizeInvariants({
      ledger,
      stockBefore,
      stockAfter,
      orderCount,
      paymentCount,
    });

    expect(allPass(invariants)).toBe(true);

    const latencies = ledger.map((row) => row.latencyMs).sort((x, y) => x - y);
    const percentile = (p: number) =>
      latencies[Math.min(latencies.length - 1, Math.floor(p * latencies.length))];
    const stats = {
      elapsedMs,
      throughputPerSec: Math.round((ledger.length / elapsedMs) * 1000),
      p50: percentile(0.5),
      p95: percentile(0.95),
    };

    results.push({
      name: 'S5',
      params: { stockBefore, stats },
      totalRequests: ledger.length,
      successCount: orderCount,
      failedByCategory: failureCounts(ledger),
      invariants,
      dbState: { stockAfter, orderCount, paymentCount, ...stats },
      ledger,
    });
  });

  it('S6: continuation with stock=0 -> no success, DB unchanged', async () => {
    const { ids, sessions } = await setup([{ name: 'S6', stock: 10 }]);
    await fireConcurrent(50, (i) =>
      postOrder({
        token: sessions[i % sessions.length].token,
        userId: sessions[i % sessions.length].userId,
        seq: i,
        scenario: 'S6-fill',
        payload: cashPayload([{ productId: ids[0], quantity: 1 }]),
      }),
    );
    const orderCountAfterFill = await countOrders();
    const paymentCountAfterFill = await countPayments();

    const stockBefore = await getStocks(ids);
    const ledger = await fireConcurrent(20, (i) =>
      postOrder({
        token: sessions[i % sessions.length].token,
        userId: sessions[i % sessions.length].userId,
        seq: i,
        scenario: 'S6',
        payload: cashPayload([{ productId: ids[0], quantity: 1 }]),
      }),
    );
    const stockAfter = await getStocks(ids);
    const orderCount = await countOrders();
    const paymentCount = await countPayments();
    const invariants = summarizeInvariants({
      ledger,
      stockBefore,
      stockAfter,
      orderCount: orderCount - orderCountAfterFill,
      paymentCount: paymentCount - paymentCountAfterFill,
    });

    expect(stockAfter[ids[0]]).toBe(0);
    expect(orderCount).toBe(orderCountAfterFill);
    expect(ledger.filter((row) => row.httpStatus === 201)).toHaveLength(0);
    expect(allPass(invariants)).toBe(true);

    results.push({
      name: 'S6',
      params: { stockBefore },
      totalRequests: ledger.length,
      successCount: 0,
      failedByCategory: failureCounts(ledger),
      invariants,
      dbState: { stockAfter, orderCount, paymentCount, orderCountAfterFill },
      ledger,
    });
  });

  it('S7: duplicate line items against stock=3 -> no oversell', async () => {
    const { ids, sessions } = await setup([{ name: 'S7', stock: 3 }]);
    const stockBefore = await getStocks(ids);
    const ledger = await fireConcurrent(10, (i) =>
      postOrder({
        token: sessions[i % sessions.length].token,
        userId: sessions[i % sessions.length].userId,
        seq: i,
        scenario: 'S7',
        payload: cashPayload([
          { productId: ids[0], quantity: 2 },
          { productId: ids[0], quantity: 2 },
        ]),
      }),
    );
    const stockAfter = await getStocks(ids);
    const orderCount = await countOrders();
    const paymentCount = await countPayments();
    const invariants = summarizeInvariants({
      ledger,
      stockBefore,
      stockAfter,
      orderCount,
      paymentCount,
    });

    expect(stockAfter[ids[0]]! >= 0).toBe(true);
    expect(allPass(invariants)).toBe(true);

    results.push({
      name: 'S7',
      params: { stockBefore },
      totalRequests: ledger.length,
      successCount: orderCount,
      failedByCategory: failureCounts(ledger),
      invariants,
      dbState: { stockAfter, orderCount, paymentCount },
      ledger,
      notes:
        orderCount === 0
          ? 'duplicate line items are rejected atomically (first decrement passes, second sees insufficient stock -> rollback)'
          : 'duplicate line items accepted; total decrement equals 4 across both lines',
    });
  });
});
