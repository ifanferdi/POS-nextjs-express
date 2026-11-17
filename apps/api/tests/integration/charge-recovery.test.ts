import { afterAll, beforeAll, expect, test } from 'bun:test';
import express from 'express';
import { randomUUID } from 'node:crypto';

const database = new URL(process.env.DATABASE_URL || 'postgresql://localhost/disabled');
const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost');
if (
  process.env.RUN_LOCAL_INTEGRATION !== '1' ||
  !['localhost', '127.0.0.1'].includes(database.hostname) ||
  !database.pathname.includes('test') ||
  !['localhost', '127.0.0.1'].includes(redisUrl.hostname)
) {
  throw new Error('Use RUN_LOCAL_INTEGRATION=1 with isolated local test PostgreSQL and Redis.');
}
process.env.HASH_SECRET = 'charge-recovery-integration-only';
process.env.APP_ENV = 'development';
process.env.AUTH_MODE = 'stateless';
process.env.AUTH_USE_2FA = 'false';
const { default: config } = await import('@/config/config');
let mode = 'reject';
let chargeCount = 0;
const gateway = Bun.serve({
  port: 0,
  hostname: '127.0.0.1',
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/v2/charge') {
      chargeCount++;
      const input = await request.json();
      if (mode === 'reject') return Response.json({ status_code: '400' }, { status: 400 });
      if (['uncertain', 'lost-settlement'].includes(mode))
        return Response.json({}, { status: 503 });
      return Response.json({
        order_id: input.transaction_details.order_id,
        transaction_id: input.transaction_details.order_id,
        transaction_status: mode === 'lost-settlement' ? 'settlement' : mode,
        payment_type: 'qris',
        fraud_status: 'accept',
        status_code: '201',
      });
    }
    const orderNumber = decodeURIComponent(url.pathname.split('/')[2]);
    if (mode === 'uncertain') return Response.json({}, { status: 503 });
    return Response.json({
      order_id: orderNumber,
      transaction_id: orderNumber,
      transaction_status: mode === 'lost-settlement' ? 'settlement' : mode,
      payment_type: 'qris',
      fraud_status: 'accept',
      status_code: '200',
    });
  },
});
config.midtrans.baseUrl = gateway.url.origin;
const { default: bootstrap } = await import('@/bootstrap');
const { prisma: db, prismaNonLogger } = await import('@/infrastructure/database/prisma/prisma');
const { default: RedisConnection } = await import('@/infrastructure/redis/redis-connection');
const { closeSSERedisBridge } = await import('@/infrastructure/event-stream/sse-redis-bridge');
const { hash } = await import('@/helpers/password.helper');
const app = express();
await bootstrap(app);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>((resolve) => server.once('listening', resolve));
const address = server.address();
if (!address || typeof address === 'string') throw new Error('No server address');
const origin = `http://127.0.0.1:${address.port}`;
const redis = await RedisConnection();
let userId = 0;
let productId = 0;
let token = '';
const prefix = `charge-${randomUUID()}`;

beforeAll(async () => {
  const user = await db.user.create({
    data: {
      username: prefix,
      password: await hash('password'),
      profile: {
        create: {
          fullName: prefix,
          placeOfBirth: 'Jakarta',
          dateOfBirth: new Date('1995-01-01'),
          gender: 'male',
          age: 31,
        },
      },
    },
  });
  userId = user.id;
  const product = await db.product.create({ data: { name: prefix, price: 10000, stock: 100 } });
  productId = product.id;
  await redis.set(`permissions:user-${userId}`, JSON.stringify(['Show Order', 'Manage Order']));
  const login = await fetch(`${origin}/api/v1/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: prefix, password: 'password' }),
  });
  const body = await login.json();
  expect(login.status).toBe(200);
  token = body.token;
});

async function submit(key: string, useDiscount = false) {
  const response = await fetch(`${origin}/api/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'Idempotency-Key': key,
    },
    body: JSON.stringify({
      items: [{ productId, quantity: 1, useDiscount }],
      paymentMethod: 'qris',
    }),
  });
  const body = await response.json();
  return { status: response.status, body };
}
async function order(key: string) {
  return db.order.findFirstOrThrow({
    where: { userId, idempotencyKey: key },
    include: { payment: { include: { midtransDetail: true } } },
  });
}
async function stock() {
  return (await db.product.findUniqueOrThrow({ where: { id: productId } })).stock;
}

test('definite rejection restores stock once and survives Redis key loss', async () => {
  mode = 'reject';
  const key = randomUUID();
  const before = await stock();
  expect((await submit(key)).status).toBe(400);
  const saved = await order(key);
  expect(saved.status).toBe('cancelled');
  expect(saved.payment?.status).toBe('failed');
  expect(await stock()).toBe(before);
  const charges = chargeCount;
  await redis.del(`order:idempotency:${userId}:${key}`);
  expect((await submit(key)).status).toBe(400);
  expect(chargeCount).toBe(charges);
  expect(await stock()).toBe(before);
});

test('uncertain charge holds stock, then same key recovers QRIS without another charge', async () => {
  mode = 'uncertain';
  const key = randomUUID();
  const before = await stock();
  expect((await submit(key)).status).toBe(500);
  expect(await stock()).toBe(before - 1);
  const charges = chargeCount;
  mode = 'pending';
  await redis.del(`order:idempotency:${userId}:${key}`);
  const recovered = await submit(key);
  expect(recovered.status).toBe(200);
  expect(recovered.body.order.payment.midtransDetail.qrCodeUrl).toContain('/v2/qris/');
  expect(chargeCount).toBe(charges);
  expect(await stock()).toBe(before - 1);
  expect(await db.order.count({ where: { userId, idempotencyKey: key } })).toBe(1);
});

test('uncertain charge reconciles settlement and terminal denial', async () => {
  for (const status of ['settlement', 'deny']) {
    mode = 'uncertain';
    const key = randomUUID();
    const before = await stock();
    expect((await submit(key)).status).toBe(500);
    mode = status;
    expect((await submit(key)).status).toBe(status === 'settlement' ? 200 : 400);
    const saved = await order(key);
    expect(saved.status).toBe(status === 'settlement' ? 'completed' : 'cancelled');
    expect(saved.payment?.status).toBe(status === 'settlement' ? 'success' : 'failed');
    expect(await stock()).toBe(status === 'settlement' ? before - 1 : before);
  }
});

test('status lookup completes a charge whose response was lost after settlement', async () => {
  mode = 'lost-settlement';
  const key = randomUUID();
  const before = await stock();
  const response = await submit(key);
  expect(response.status).toBe(201);
  expect(response.body.order.status).toBe('completed');
  expect((await order(key)).payment?.status).toBe('success');
  expect(await stock()).toBe(before - 1);
});

test('database uniqueness rejects duplicate keys for the same cashier', async () => {
  const key = randomUUID();
  mode = 'pending';
  expect((await submit(key)).status).toBe(201);
  await expect(
    Promise.resolve(
      db.order.create({ data: { userId, orderNumber: randomUUID(), idempotencyKey: key } }),
    ),
  ).rejects.toThrow();
});

test('concurrent retries preserve one order and one stock reservation', async () => {
  mode = 'pending';
  const key = randomUUID();
  const before = await stock();
  const results = await Promise.all(Array.from({ length: 6 }, () => submit(key)));
  expect(results.every((result) => [200, 201, 409].includes(result.status))).toBe(true);
  expect(await db.order.count({ where: { userId, idempotencyKey: key } })).toBe(1);
  expect(await stock()).toBe(before - 1);
});

test('rejected promotional charge restores database and Redis quota once', async () => {
  const discount = await db.productDiscountCycle.create({
    data: {
      productId,
      amount: 1000,
      quota: 10,
      startDate: new Date(Date.now() - 60000),
      endDate: new Date(Date.now() + 3600000),
    },
  });
  const quotaKey = `product-discount-cycle:remaining:${discount.id}`;
  try {
    mode = 'reject';
    const key = randomUUID();
    const before = await stock();
    expect((await submit(key, true)).status).toBe(400);
    expect(
      (await db.productDiscountCycle.findUniqueOrThrow({ where: { id: discount.id } })).usedQty,
    ).toBe(0);
    expect(await redis.get(quotaKey)).toBe('10');
    const results = await Promise.all([submit(key, true), submit(key, true)]);
    expect(results.every((result) => result.status === 400)).toBe(true);
    expect(await redis.get(quotaKey)).toBe('10');
    expect(await stock()).toBe(before);
  } finally {
    await db.productDiscountCycle.delete({ where: { id: discount.id } });
    await redis.del(quotaKey);
  }
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  gateway.stop(true);
  await db.order.deleteMany({ where: { userId } });
  await db.product.deleteMany({ where: { id: productId } });
  await db.user.deleteMany({ where: { id: userId } });
  await redis.del(`permissions:user-${userId}`);
  await closeSSERedisBridge();
  await redis.quit();
  await db.$disconnect();
  await prismaNonLogger.$disconnect();
});
