import config from '@/config/config';
import { sseManager } from '@/infrastructure/event-stream/sse-manager';
import { CreateRedisConnection } from '@/infrastructure/redis/redis-connection';

const SSE_CHANNEL = config.sse.channel;

let publisher = CreateRedisConnection();
let subscriber = publisher.duplicate();
publisher.connect();
subscriber.connect();

type SSEScope = (typeof config.sse.scope)[number];
type SSEMessage = {
  scope?: SSEScope;
  action: string;
  entity: string;
  data: unknown[];
};

export async function initSSERedisBridge() {
  try {
    await subscriber.subscribe(config.sse.channel, (message, _) => {
      try {
        const payload: SSEMessage = JSON.parse(message);
        const event = `${payload.entity}.${payload.action}`;

        if (payload.scope === 'order' && payload.entity === 'order') {
          const updates = payload.data.flatMap((record) => {
            if (typeof record !== 'object' || record === null) return [];
            const order = record as Record<string, unknown>;

            if (
              typeof order.id !== 'number' ||
              typeof order.userId !== 'number' ||
              typeof order.orderNumber !== 'string' ||
              typeof order.status !== 'string'
            )
              return [];

            return [
              {
                ownerUserId: String(order.userId),
                data: {
                  id: order.id,
                  orderNumber: order.orderNumber,
                  status: order.status,
                },
              },
            ];
          });

          sseManager.sendOrderUpdates({
            event,
            entity: payload.entity,
            action: payload.action,
            updates,
          });
        } else if (payload.scope === 'product' && payload.entity === 'product') {
          sseManager.sendProductUpdate({
            event,
            entity: payload.entity,
            action: payload.action,
            data: payload.data,
          });
        }

        // Data order/payment/product berubah → cache dashboard langsung di-invalidasi
        // supaya refetch setelah event SSE tidak menyajikan angka stale.
        if (['order', 'payment', 'product'].includes(payload.entity)) {
          invalidateDashboardCache().catch((err) =>
            console.error('Failed to invalidate dashboard cache:', err),
          );
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    });

    console.log(`✅  Subscribed to ${config.sse.channel}`);
  } catch (err) {
    console.error('Failed to subscribe SSE channel:', err);
  }
}

// shortcut: KEYS blocking — aman untuk jumlah key dashboard yang kecil;
// ganti ke SCAN kalau key dashboard tumbuh banyak.
async function invalidateDashboardCache() {
  const keys = await subscriber.keys('dashboard:*');
  if (keys.length) await subscriber.del(keys);
}

// Dipanggil dari service manapun (bukan cuma dari SSE controller)
// untuk trigger event ke semua instance
export async function publishSSEEvent(payload: SSEMessage) {
  await publisher.publish(SSE_CHANNEL, JSON.stringify(payload));
}

export async function closeSSERedisBridge() {
  await subscriber.unsubscribe(SSE_CHANNEL);
  await subscriber.quit();
  await publisher.quit();
}
