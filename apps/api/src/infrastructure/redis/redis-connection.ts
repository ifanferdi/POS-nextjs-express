import config from '@/config/config';
import { createClient, RedisClientType } from 'redis';

const REDIS_CONNECTION_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
]);
const REDIS_URL = config.redis.url;

let sharedClient: RedisClientType | undefined;
let connecting: Promise<RedisClientType> | undefined;

export default async function RedisConnection(): Promise<RedisClientType> {
  if (sharedClient) return sharedClient;
  if (connecting) return connecting;

  connecting = (async () => {
    const client = createClient({ url: REDIS_URL }) as RedisClientType;

    client.on('error', (error: Error) => {
      const code =
        'code' in error &&
        typeof error.code === 'string' &&
        REDIS_CONNECTION_ERROR_CODES.has(error.code)
          ? error.code
          : 'UNKNOWN';

      console.error(`Redis connection error (${code}).`);
    });

    await client.connect();
    console.log('✅  Redis connected.');

    sharedClient = client;
    return client;
  })();

  try {
    return await connecting;
  } finally {
    connecting = undefined;
  }
}

export const CreateRedisConnection = () => createClient({ url: REDIS_URL }) as RedisClientType;
