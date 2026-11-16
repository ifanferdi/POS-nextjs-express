import config from '@/config/config';
import { createClient, RedisClientType } from 'redis';

const REDIS_SAFE_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
  'WRONGPASS',
  'NOAUTH',
]);
const REDIS_AUTH_ERROR_PREFIXES = ['WRONGPASS', 'NOAUTH'];
const REDIS_URL = config.redis.url;

let sharedClient: RedisClientType | undefined;
let connecting: Promise<RedisClientType> | undefined;

export default async function RedisConnection(): Promise<RedisClientType> {
  if (sharedClient) return sharedClient;
  if (connecting) return connecting;

  connecting = (async () => {
    const client = createClient({ url: REDIS_URL }) as RedisClientType;

    client.on('error', (error: Error) => {
      const errorCode =
        'code' in error && typeof error.code === 'string' && REDIS_SAFE_ERROR_CODES.has(error.code)
          ? error.code
          : undefined;
      const authErrorPrefix = REDIS_AUTH_ERROR_PREFIXES.find(
        (prefix) => error.message === prefix || error.message.startsWith(`${prefix} `),
      );
      const code = errorCode ?? authErrorPrefix ?? 'UNKNOWN';

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
