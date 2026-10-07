import { OrderStatus } from '@/domain/entities/enums/order.enum';
import { PaymentMethod, PaymentStatus } from '@/domain/entities/enums/payment.enum';
import { afterAll, describe, expect, it, setDefaultTimeout } from 'bun:test';
import { fireConcurrent } from './barrier';
import { LedgerRow, mockMidtrans, postOrder } from './client';
import {
  countOrders,
  countPayments,
  getOrdersWithPayment,
  getStock,
  getStocks,
  loginAll,
  resetAll,
  seedBase,
  seedProduct,
} from './fixtures';
import { failureCounts, Verdict } from './invariants';
import { ScenarioResult, writeReport } from './report';

type OrderWithPayment = Awaited<ReturnType<typeof getOrdersWithPayment>>[number];

interface ProductSpec {
  name: string;
  stock: number;
  price?: number;
}

const results: ScenarioResult[] = [];
setDefaultTimeout(180_000);

const onlinePayload = (productId: number, quantity = 1) => ({
  items: [{ productId, quantity }],
  paymentMethod: PaymentMethod.QRIS,
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

function summarizeMidtrans(opts: {
  ledger: LedgerRow[];
  orders: OrderWithPayment[];
  stockBefore: Record<number, number>;
  stockAfter: Record<number, number>;
  orderCount: number;
  paymentCount: number;
}): Record<string, Verdict> {
  const { ledger, orders, stockBefore, stockAfter, orderCount, paymentCount } = opts;

  const createdQty: Record<number, number> = {};
  const soldQty: Record<number, number> = {};
  for (const order of orders) {
    for (const item of order.orderItems) {
      if (!item.productId) continue;
      createdQty[item.productId] = (createdQty[item.productId] ?? 0) + item.quantity;
      if (order.payment?.status === PaymentStatus.SUCCESS)
        soldQty[item.productId] = (soldQty[item.productId] ?? 0) + item.quantity;
    }
  }

  const pass = (ok: boolean): Verdict => (ok ? 'pass' : 'fail');

  return {
    'INV-1': pass(
      Object.keys(createdQty).every(
        (id) => createdQty[Number(id)] <= (stockBefore[Number(id)] ?? 0),
      ),
    ),
    'INV-2': pass(
      Object.keys(stockBefore).every(
        (id) =>
          stockAfter[Number(id)] === (stockBefore[Number(id)] ?? 0) - (soldQty[Number(id)] ?? 0),
      ),
    ),
    'INV-3': pass(orderCount === orders.length && paymentCount === orders.length),
    'INV-5': pass(ledger.every((row) => row.category !== 'unknown')),
    'INV-7': pass(
      orders.every(
        (order) =>
          !(
            order.payment?.status === PaymentStatus.SUCCESS &&
            order.status !== OrderStatus.COMPLETED
          ) &&
          !(
            order.payment?.status === PaymentStatus.EXPIRED && order.status !== OrderStatus.EXPIRED
          ),
      ),
    ),
  };
}

// Pre-check the sandbox once at collection time. If the real charge fails, the whole M suite is
// SKIPPED (recorded, not passed) per D8.
const probe = await (async () => {
  const { ids, sessions } = await setup([{ name: 'sandbox-probe', stock: 5, price: 1000 }]);
  const row = await postOrder({
    token: sessions[0].token,
    userId: sessions[0].userId,
    seq: 0,
    scenario: 'sandbox-probe',
    payload: onlinePayload(ids[0]),
  });
  return { available: row.httpStatus === 201, ledger: [row], category: row.category };
})();

const describeMidtrans = probe.available ? describe : describe.skip;

if (!probe.available) {
  writeReport(
    [
      {
        name: 'M1-M5',
        totalRequests: 1,
        successCount: 0,
        failedByCategory: { [probe.category ?? 'charge-failed']: 1 },
        invariants: {},
        ledger: probe.ledger,
        skipped: 'sandbox unavailable (charge-failed)',
      },
    ],
    { suite: 'midtrans', sandbox: 'unavailable' },
  );
  console.warn('⚠️  Midtrans scenarios SKIPPED: sandbox unavailable');
}

afterAll(() => {
  if (results.length) writeReport(results, { suite: 'midtrans', scenarios: results.length });
});

describeMidtrans('Midtrans race scenarios', () => {
  it('M1: stock=10, 15 QRIS barrier -> 10 created, settle all', async () => {
    const { ids, sessions } = await setup([{ name: 'M1', stock: 10 }]);
    const stockBefore = await getStocks(ids);
    const ledger = await fireConcurrent(15, (i) =>
      postOrder({
        token: sessions[i % sessions.length].token,
        userId: sessions[i % sessions.length].userId,
        seq: i,
        scenario: 'M1',
        payload: onlinePayload(ids[0]),
      }),
    );
    const created = ledger.filter((row) => row.httpStatus === 201);
    await fireConcurrent(created.length, (i) =>
      mockMidtrans(created[i].orderNumber!, 'settlement'),
    );

    const orders = await getOrdersWithPayment();
    const stockAfter = await getStocks(ids);
    const invariants = summarizeMidtrans({
      ledger,
      orders,
      stockBefore,
      stockAfter,
      orderCount: await countOrders(),
      paymentCount: await countPayments(),
    });

    expect(created.length).toBe(10);
    expect(orders.every((order) => order.payment?.status === PaymentStatus.SUCCESS)).toBe(true);
    expect(Object.values(invariants).every((value) => value === 'pass')).toBe(true);

    results.push({
      name: 'M1',
      params: { stockBefore },
      totalRequests: ledger.length,
      successCount: created.length,
      failedByCategory: failureCounts(ledger),
      invariants,
      dbState: { stockAfter, orderCount: orders.length },
      ledger,
    });
  });

  it('M2: settle+expire barrier -> exactly one outcome (x5)', async () => {
    const { ids, sessions } = await setup([{ name: 'M2', stock: 10 }]);
    const stockBefore = await getStocks(ids);
    const ledger: LedgerRow[] = [];
    const observations: Record<string, unknown>[] = [];

    for (let round = 0; round < 5; round++) {
      const create = await postOrder({
        token: sessions[round % sessions.length].token,
        userId: sessions[round % sessions.length].userId,
        seq: round,
        scenario: 'M2',
        payload: onlinePayload(ids[0]),
      });
      ledger.push(create);
      if (create.httpStatus !== 201) continue;

      const orderNumber = create.orderNumber!;
      const stockAfterCreate = await getStock(ids[0]);
      await fireConcurrent(2, (i) => mockMidtrans(orderNumber, i === 0 ? 'settlement' : 'expire'));

      const orders = await getOrdersWithPayment();
      const order = orders.find((row) => row.orderNumber === orderNumber);
      const stockAfter = await getStock(ids[0]);

      const paid = order?.payment?.status === PaymentStatus.SUCCESS;
      const expired = order?.payment?.status === PaymentStatus.EXPIRED;
      const refundedOnce = stockAfter === (stockAfterCreate ?? 0) + 1;
      const noDoubleRefund = stockAfter !== (stockAfterCreate ?? 0) + 2;
      const consistent =
        ((paid && order?.status === OrderStatus.COMPLETED && stockAfter === stockAfterCreate) ||
          (expired &&
            order?.status === OrderStatus.EXPIRED &&
            refundedOnce &&
            !order?.payment?.paidAt)) &&
        noDoubleRefund;

      observations.push({
        round,
        paid,
        expired,
        status: order?.status,
        payment: order?.payment?.status,
        stockAfterCreate,
        stockAfter,
        consistent,
      });
    }

    const orders = await getOrdersWithPayment();
    const stockAfter = await getStocks(ids);
    const invariants = summarizeMidtrans({
      ledger,
      orders,
      stockBefore,
      stockAfter,
      orderCount: await countOrders(),
      paymentCount: await countPayments(),
    });
    const inconsistent = observations.filter(
      (observation) => observation.consistent === false,
    ).length;

    expect(inconsistent).toBe(0);
    expect(Object.values(invariants).every((value) => value === 'pass')).toBe(true);

    results.push({
      name: 'M2',
      params: { stockBefore },
      totalRequests: 5,
      successCount: observations.filter((observation) => observation.paid).length,
      failedByCategory: failureCounts(ledger),
      invariants: { ...invariants, 'INV-6': inconsistent === 0 ? 'pass' : 'fail' },
      dbState: { observations, stockAfter },
      ledger,
    });
  });

  it('M3: 20 identical settlements -> effect once (INV-8)', async () => {
    const { ids, sessions } = await setup([{ name: 'M3', stock: 10 }]);
    const stockBefore = await getStocks(ids);
    const create = await postOrder({
      token: sessions[0].token,
      userId: sessions[0].userId,
      seq: 0,
      scenario: 'M3',
      payload: onlinePayload(ids[0]),
    });
    const orderNumber = create.orderNumber!;
    const stockAfterCreate = await getStock(ids[0]);

    await fireConcurrent(20, () => mockMidtrans(orderNumber, 'settlement'));

    const orders = await getOrdersWithPayment();
    const stockAfter = await getStocks(ids);
    const invariants = summarizeMidtrans({
      ledger: [create],
      orders,
      stockBefore,
      stockAfter,
      orderCount: await countOrders(),
      paymentCount: await countPayments(),
    });
    const order = orders.find((row) => row.orderNumber === orderNumber);

    expect(order?.payment?.status).toBe(PaymentStatus.SUCCESS);
    expect(order?.status).toBe(OrderStatus.COMPLETED);
    expect(stockAfter[ids[0]]).toBe(stockAfterCreate);
    expect(invariants['INV-2']).toBe('pass');

    results.push({
      name: 'M3',
      params: { stockBefore },
      totalRequests: 21,
      successCount: 1,
      failedByCategory: {},
      invariants: { ...invariants, 'INV-8': 'pass' },
      dbState: { stockAfter, stockAfterCreate },
      ledger: [create],
    });
  });

  it('M4: 20 concurrent expires -> stock refunded exactly once (INV-6)', async () => {
    const { ids, sessions } = await setup([{ name: 'M4', stock: 10 }]);
    const stockBefore = await getStocks(ids);
    const create = await postOrder({
      token: sessions[0].token,
      userId: sessions[0].userId,
      seq: 0,
      scenario: 'M4',
      payload: onlinePayload(ids[0]),
    });
    const orderNumber = create.orderNumber!;
    const stockAfterCreate = await getStock(ids[0]);

    await fireConcurrent(20, () => mockMidtrans(orderNumber, 'expire'));

    const orders = await getOrdersWithPayment();
    const stockAfter = await getStocks(ids);
    const invariants = summarizeMidtrans({
      ledger: [create],
      orders,
      stockBefore,
      stockAfter,
      orderCount: await countOrders(),
      paymentCount: await countPayments(),
    });
    const order = orders.find((row) => row.orderNumber === orderNumber);
    const refundOnce = stockAfter[ids[0]] === (stockAfterCreate ?? 0) + 1;

    expect(order?.payment?.status).toBe(PaymentStatus.EXPIRED);
    expect(order?.status).toBe(OrderStatus.EXPIRED);
    expect(refundOnce).toBe(true);
    expect(invariants['INV-2']).toBe('pass');

    results.push({
      name: 'M4',
      params: { stockBefore },
      totalRequests: 21,
      successCount: 0,
      failedByCategory: {},
      invariants: { ...invariants, 'INV-6': refundOnce ? 'pass' : 'fail' },
      dbState: { stockAfter, stockAfterCreate },
      ledger: [create],
    });
  });

  it('M5: sequential expire recovers conservation (INV-2)', async () => {
    const { ids, sessions } = await setup([{ name: 'M5', stock: 10 }]);
    const stockBefore = await getStocks(ids);
    const ledger: LedgerRow[] = [];

    for (let i = 0; i < 3; i++) {
      ledger.push(
        await postOrder({
          token: sessions[i % sessions.length].token,
          userId: sessions[i % sessions.length].userId,
          seq: i,
          scenario: 'M5',
          payload: onlinePayload(ids[0]),
        }),
      );
    }

    await mockMidtrans(ledger[0].orderNumber!, 'settlement');
    await mockMidtrans(ledger[1].orderNumber!, 'expire');
    await mockMidtrans(ledger[2].orderNumber!, 'expire');

    const orders = await getOrdersWithPayment();
    const stockAfter = await getStocks(ids);
    const invariants = summarizeMidtrans({
      ledger,
      orders,
      stockBefore,
      stockAfter,
      orderCount: await countOrders(),
      paymentCount: await countPayments(),
    });

    expect(stockAfter[ids[0]]).toBe((stockBefore[ids[0]] ?? 0) - 1);
    expect(Object.values(invariants).every((value) => value === 'pass')).toBe(true);

    results.push({
      name: 'M5',
      params: { stockBefore },
      totalRequests: ledger.length,
      successCount: 1,
      failedByCategory: failureCounts(ledger),
      invariants,
      dbState: { stockAfter, orderCount: orders.length },
      ledger,
    });
  });
});
