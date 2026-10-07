import { classify, FailureCategory } from './classify';
import { baseUrl } from './harness';

export interface LedgerRow {
  seq: number;
  scenario: string;
  userId: number;
  payload: unknown;
  httpStatus: number | null;
  latencyMs: number;
  orderNumber?: string;
  error?: string;
  category?: FailureCategory;
}

export interface PostOrderOptions {
  token: string;
  payload: Record<string, unknown>;
  seq: number;
  scenario: string;
  userId: number;
}

export async function postJson(path: string, token: string, payload: unknown) {
  const startedAt = performance.now();

  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    const text = await res.text();

    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { message: text };
    }

    return { status: res.status as number | null, body, latencyMs };
  } catch (error: any) {
    return {
      status: null as number | null,
      body: null,
      latencyMs: Math.round(performance.now() - startedAt),
      error,
    };
  }
}

export function mockMidtrans(
  orderNumber: string,
  transactionStatus: 'settlement' | 'expire' | 'cancel' | 'deny' = 'settlement',
) {
  return postJson('/api/v1/webhooks/midtrans/mock', '', { orderNumber, transactionStatus });
}

export async function postOrder(options: PostOrderOptions): Promise<LedgerRow> {
  const row: LedgerRow = {
    seq: options.seq,
    scenario: options.scenario,
    userId: options.userId,
    payload: options.payload,
    httpStatus: null,
    latencyMs: 0,
  };

  const { status, body, latencyMs, error } = await postJson(
    '/api/v1/orders',
    options.token,
    options.payload,
  );
  row.httpStatus = status;
  row.latencyMs = latencyMs;

  if (error) {
    row.error = error?.message ?? String(error);
    row.category = classify({ httpStatus: null, message: row.error });
  } else if (status === 201) {
    // cash/online create wraps the entity: { message, order: { order: {...} } } | { message, order: {...} }
    const order = body?.order?.order ?? body?.order;
    row.orderNumber = order?.orderNumber ?? order?.order?.orderNumber;
  } else {
    row.error = body?.message ?? `HTTP ${status}`;
    row.category = classify({ httpStatus: status, message: row.error });
  }

  return row;
}
