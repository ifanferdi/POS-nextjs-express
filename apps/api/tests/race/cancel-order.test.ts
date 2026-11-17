import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { postJson } from './client';
import {
  getOrderByNumber,
  getStock,
  loginAll,
  resetAll,
  seedBase,
  seedPendingOnlineOrder,
  seedProduct,
} from './fixtures';
import { baseUrl, closeHarness } from './harness';

const { prismaNonLogger: db } = await import('@/infrastructure/database/prisma/prisma');

let userId = 0;
let productId = 0;
let token = '';
let orderSequence = 0;

beforeAll(async () => {
  await resetAll();
  await seedBase();
  productId = await seedProduct('Cancel Product', 10, 10000);
  const [session] = await loginAll();
  userId = session.userId;
  token = session.token;
});

afterAll(async () => {
  await closeHarness();
  await db.$disconnect();
});

async function seedCashOrder() {
  orderSequence += 1;
  const orderNumber = `INV-CANCEL-${Date.now()}-${orderSequence}`;
  const order = await db.order.create({
    data: {
      userId,
      orderNumber,
      subtotal: 10000,
      total: 10000,
      status: 'completed',
      orderItems: {
        create: { productId, quantity: 2, unitPrice: 5000, totalPrice: 10000 },
      },
      payment: {
        create: {
          subtotal: 10000,
          total: 10000,
          amount: 10000,
          method: 'cash',
          status: 'success',
        },
      },
    },
  });
  await db.product.update({ where: { id: productId }, data: { stock: { decrement: 2 } } });
  return order;
}

describe('order cancellation API and database outcomes', () => {
  it('restores stock once when two cancellation requests race', async () => {
    const order = await seedCashOrder();
    const initialStock = await getStock(productId);
    const responses = await Promise.all([
      postJson(`/api/v1/orders/${order.id}/cancel`, token, {}),
      postJson(`/api/v1/orders/${order.id}/cancel`, token, {}),
    ]);

    const updated = await getOrderByNumber(order.orderNumber);
    expect(responses.map(({ status }) => status)).toEqual([200, 200]);
    expect(updated?.status).toBe('cancelled');
    expect(updated?.payment?.status).toBe('success');
    expect(await getStock(productId)).toBe((initialStock ?? 0) + 2);
  });

  it('rejects setting cancelled through the general status endpoint', async () => {
    const order = await seedCashOrder();
    const initialStock = await getStock(productId);
    const response = await fetch(`${baseUrl()}/api/v1/orders/${order.id}/status`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    expect(response.status).toBe(400);
    expect((await getOrderByNumber(order.orderNumber))?.status).toBe('completed');
    expect(await getStock(productId)).toBe(initialStock);
  });

  it('rejects a paid online cancellation without changing order, payment, or stock', async () => {
    const order = await seedPendingOnlineOrder({
      userId,
      items: [{ productId, quantity: 1, unitPrice: 10000 }],
    });
    await db.$transaction([
      db.payment.update({
        where: { orderId: order.id },
        data: { status: 'success', paidAt: new Date() },
      }),
      db.order.update({ where: { id: order.id }, data: { status: 'completed' } }),
    ]);
    const before = await getOrderByNumber(order.orderNumber);
    const stockBefore = await getStock(productId);

    const response = await postJson(`/api/v1/orders/${order.id}/cancel`, token, {});
    const after = await getOrderByNumber(order.orderNumber);

    expect(response.status).toBe(400);
    expect(after?.status).toBe(before?.status);
    expect(after?.payment?.status).toBe(before?.payment?.status);
    expect(await getStock(productId)).toBe(stockBefore);
  });
});
