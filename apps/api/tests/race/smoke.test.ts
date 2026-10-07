import { PaymentMethod } from '@/domain/entities/enums/payment.enum';
import { beforeAll, describe, expect, it, setDefaultTimeout } from 'bun:test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fireConcurrent } from './barrier';
import { classify, FailureCategory } from './classify';
import { postOrder } from './client';
import {
  cachePermissions,
  login,
  loginAll,
  resetAll,
  seedBase,
  seedProduct,
  seedRoleWithoutPermission,
  seedUser,
} from './fixtures';
import { baseUrl } from './harness';
import { writeReport } from './report';

setDefaultTimeout(180_000);

let productId = 0;
let sessions: { userId: number; username: string; token: string }[] = [];

beforeAll(async () => {
  await resetAll();
  await seedBase();
  productId = await seedProduct('Race Product', 100, 10000);
  sessions = await loginAll();
});

describe('race harness', () => {
  it('boots the app in-process and serves the index (T2)', async () => {
    const res = await fetch(`${baseUrl()}/`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { name?: string };
    expect(body.name).toBeTruthy();
  });

  it('enforces auth and permission (T3)', async () => {
    const noToken = await fetch(`${baseUrl()}/api/v1/orders`);
    expect(noToken.status).toBe(401);

    const noPermRole = await seedRoleWithoutPermission();
    const noPermUser = await seedUser('race-no-perm', noPermRole);
    await cachePermissions([noPermUser.id], []);
    const noPermToken = await login('race-no-perm');
    const forbidden = await fetch(`${baseUrl()}/api/v1/orders`, {
      headers: { Authorization: `Bearer ${noPermToken}` },
    });
    expect(forbidden.status).toBe(403);

    const allowed = await fetch(`${baseUrl()}/api/v1/orders`, {
      headers: { Authorization: `Bearer ${sessions[0].token}` },
    });
    expect(allowed.status).toBe(200);
  });

  it('records a successful order in the ledger (T4)', async () => {
    const row = await postOrder({
      token: sessions[0].token,
      userId: sessions[0].userId,
      seq: 1,
      scenario: 'smoke',
      payload: {
        items: [{ productId, quantity: 1 }],
        paymentMethod: PaymentMethod.CASH,
        amount: 20000,
      },
    });

    expect(row.httpStatus).toBe(201);
    expect(row.orderNumber).toBeTruthy();
    expect(row.error).toBeUndefined();
    expect(row.category).toBeUndefined();
  });

  it('aligns concurrent tasks to a barrier (T5)', async () => {
    const starts: number[] = [];
    const results = await fireConcurrent(5, async (i) => {
      starts.push(Date.now());
      return i;
    });

    expect(results).toEqual([0, 1, 2, 3, 4]);
    expect(Math.max(...starts) - Math.min(...starts)).toBeLessThan(50);
  });

  it('classifies failures into the taxonomy (T6)', () => {
    const cases: Array<[{ httpStatus: number | null; message?: string }, FailureCategory]> = [
      [{ httpStatus: 500, message: 'Stok produk ID 1 tidak mencukupi.' }, 'stock-rejected'],
      [{ httpStatus: 500, message: 'Timed out during query execution' }, 'pool-timeout'],
      [
        { httpStatus: 500, message: 'Unable to start a transaction in the given time.' },
        'pool-timeout',
      ],
      [{ httpStatus: 500, message: 'ERROR: deadlock detected (40P01)' }, 'deadlock'],
      [{ httpStatus: 500, message: 'Midtrans payment error.' }, 'charge-failed'],
      [{ httpStatus: 400, message: 'Column items: Required' }, 'validation'],
      [{ httpStatus: 403, message: "You don't have the permission" }, 'auth'],
      [{ httpStatus: 500, message: 'kaboom' }, 'unknown'],
    ];

    for (const [input, expected] of cases) expect(classify(input)).toBe(expected);
  });

  it('writes report.json + report.md (T7)', () => {
    const dir = writeReport(
      [
        {
          name: 'smoke',
          totalRequests: 1,
          successCount: 1,
          failedByCategory: {},
          invariants: { 'INV-1': 'pass' },
          ledger: [],
        },
      ],
      { appEnv: 'development' },
    );

    expect(existsSync(path.join(dir, 'report.json'))).toBe(true);
    expect(existsSync(path.join(dir, 'report.md'))).toBe(true);
  });
});
