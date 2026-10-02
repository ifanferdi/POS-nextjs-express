import { beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test';
import { mockMidtrans } from './client';
import {
  getOrderByNumber,
  getStock,
  loginAll,
  resetAll,
  seedBase,
  seedPendingOnlineOrder,
  seedProduct,
} from './fixtures';

setDefaultTimeout(180_000);

let userId = 0;
let productId = 0;

beforeAll(async () => {
  await resetAll();
  await seedBase();
  productId = await seedProduct('Mock Product', 5, 10000);
  const sessions = await loginAll();
  userId = sessions[0].userId;
});

describe('midtrans mock endpoint (T9)', () => {
  it('settles a pending online order through the production sync path', async () => {
    const order = await seedPendingOnlineOrder({
      userId,
      items: [{ productId, quantity: 1, unitPrice: 10000 }],
    });
    const stockAfterSeed = await getStock(productId);

    const res = await mockMidtrans(order.orderNumber, 'settlement');
    expect(res.status).toBe(200);

    const updated = await getOrderByNumber(order.orderNumber);
    expect(updated?.payment?.status).toBe('success');
    expect(updated?.status).toBe('completed');
    expect(updated?.payment?.midtransDetail?.signatureVerified).toBe(true);
    expect(await getStock(productId)).toBe(stockAfterSeed);
  });

  it('expires a pending online order and refunds stock exactly once', async () => {
    const order = await seedPendingOnlineOrder({
      userId,
      items: [{ productId, quantity: 1, unitPrice: 10000 }],
    });
    const stockBefore = await getStock(productId);

    const res = await mockMidtrans(order.orderNumber, 'expire');
    expect(res.status).toBe(200);

    const updated = await getOrderByNumber(order.orderNumber);
    expect(updated?.payment?.status).toBe('expired');
    expect(updated?.status).toBe('expired');
    expect(await getStock(productId)).toBe((stockBefore ?? 0) + 1);
  });
});
