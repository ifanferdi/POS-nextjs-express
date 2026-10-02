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
  userId?: string;
  action: string;
  entity: string;
  data: Record<string, any>[];
};

export async function initSSERedisBridge() {
  try {
    await subscriber.subscribe(config.sse.channel, (message, channel) => {
      try {
        const payload: SSEMessage = JSON.parse(message);
        const event = `${payload.entity}.${payload.action}`;
        const data = {
          entity: payload.entity,
          action: payload.action,
          event,
          data: payload.data,
        };

        if (payload.userId) {
          sseManager.sendToUser({ userId: payload.userId, event, data });
        } else {
          sseManager.broadcast({ event, data });
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
