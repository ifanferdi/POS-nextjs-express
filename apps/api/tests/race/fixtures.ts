import { Gender } from '@/domain/entities/enums/user.enum';
import * as passwordHelper from '@/helpers/password.helper';
import './env';
import { baseUrl } from './harness';

// Dynamic imports keep config-dependent src modules behind env.ts evaluation.
const { prismaNonLogger: db } = await import('@/infrastructure/database/prisma/prisma');
const { CreateRedisConnection } = await import('@/infrastructure/redis/redis-connection');

export const RACE_PASSWORD = 'password';
export const RACE_USER_COUNT = 5;

let cachedPasswordHash: Promise<string> | undefined;
const passwordHash = () => (cachedPasswordHash ??= passwordHelper.hash(RACE_PASSWORD));

const TABLES = [
  'midtrans_payment_details',
  'payments',
  'order_items',
  'orders',
  'product_has_categories',
  'products',
  'product_categories',
  'role_has_permissions',
  'permissions',
  'roles',
  'profiles',
  'users',
];

export async function resetAll() {
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.join(', ')} RESTART IDENTITY CASCADE`);

  const redis = CreateRedisConnection();
  await redis.connect();
  await redis.flushDb();
  await redis.quit();
}

export async function seedUser(username: string, roleId: number | null) {
  const password = await passwordHash();
  const user = await db.user.create({
    data: {
      username,
      email: `${username}@example.com`,
      password,
      isActive: true,
      roleId,
      profile: {
        create: {
          fullName: `Race ${username}`,
          placeOfBirth: 'Jakarta',
          dateOfBirth: new Date('1995-01-01'),
          gender: Gender.MALE,
          age: 30,
        },
      },
    },
  });

  return { id: user.id, username: user.username };
}

export async function seedBase() {
  const permissions = await db.permission.createManyAndReturn({
    data: [{ name: 'Manage Order' }, { name: 'Show Order' }],
  });

  const role = await db.role.create({ data: { name: 'Race Role' } });
  await db.roleHasPermission.createMany({
    data: permissions.map((permission) => ({ roleId: role.id, permissionId: permission.id })),
  });

  const users = [];
  for (let i = 1; i <= RACE_USER_COUNT; i++) users.push(await seedUser(`race-user-${i}`, role.id));
  await cachePermissions(
    users.map((user) => user.id),
    ['Manage Order', 'Show Order'],
  );

  return { role: { id: role.id, name: role.name }, users };
}

/**
 * Pre-populates the permission cache (redis DB 2) that CheckValidPermission reads first.
 * Needed because the on-miss path (src/use-cases/permission/check-valid-permission.ts) reads a flat
 * `user.permissions` while the repository nests them under `role.roleHasPermissions` — cache miss
 * currently throws. Harness workaround; the bug is recorded in the report recommendations.
 */
export async function cachePermissions(userIds: number[], permissions: string[]) {
  const redis = CreateRedisConnection();
  await redis.connect();
  try {
    for (const userId of userIds)
      await redis.set(`permissions:user-${userId}`, JSON.stringify(permissions));
  } finally {
    await redis.quit();
  }
}

export async function seedRoleWithoutPermission(name = 'Race No Perm Role') {
  const role = await db.role.create({ data: { name } });
  return role.id;
}

export async function seedProduct(name: string, stock: number, price = 10000) {
  const product = await db.product.create({ data: { name, stock, price, isActive: true } });
  return product.id;
}

export async function login(username: string, password: string = RACE_PASSWORD) {
  const res = await fetch(`${baseUrl()}/api/v1/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error(`login failed for ${username}: ${res.status} ${await res.text()}`);

  const body = (await res.json()) as { token: string };
  return body.token;
}

export async function loginAll() {
  const users = await db.user.findMany({
    where: { username: { startsWith: 'race-user-' } },
    orderBy: { id: 'asc' },
  });

  const sessions = [];
  for (const user of users)
    sessions.push({ userId: user.id, username: user.username, token: await login(user.username) });

  return sessions;
}

let onlineOrderSeq = 0;

/** Seeds a pending online (qris) order directly, mirroring store()'s order+payment+stock shape. */
export async function seedPendingOnlineOrder(opts: {
  userId: number;
  items: { productId: number; quantity: number; unitPrice: number }[];
}) {
  const subtotal = opts.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  onlineOrderSeq += 1;
  const orderNumber = `INV-MOCK-${Date.now()}-${onlineOrderSeq}`;

  const order = await db.order.create({
    data: {
      userId: opts.userId,
      orderNumber,
      subtotal,
      total: subtotal,
      status: 'pending',
      orderItems: {
        create: opts.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
        })),
      },
      payment: {
        create: { subtotal, total: subtotal, amount: subtotal, method: 'qris', status: 'pending' },
      },
    },
    include: { payment: true },
  });

  for (const item of opts.items)
    await db.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });

  return order;
}

export function countOrders() {
  return db.order.count();
}

export function countPayments() {
  return db.payment.count();
}

export async function getStock(productId: number) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });
  return product?.stock ?? null;
}

export async function getStocks(productIds: number[]) {
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, stock: true },
  });
  return Object.fromEntries(products.map((product) => [product.id, product.stock])) as Record<
    number,
    number
  >;
}

export function getOrderByNumber(orderNumber: string) {
  return db.order.findUnique({
    where: { orderNumber },
    include: { payment: { include: { midtransDetail: true } }, orderItems: true },
  });
}

export function getOrdersWithPayment() {
  return db.order.findMany({
    orderBy: { id: 'asc' },
    include: { payment: { include: { midtransDetail: true } }, orderItems: true },
  });
}

export function getPendingOnlineOrders() {
  return db.order.findMany({
    where: { status: 'pending', payment: { method: { not: 'cash' } } },
    include: { payment: true, orderItems: true },
    orderBy: { id: 'asc' },
  });
}
