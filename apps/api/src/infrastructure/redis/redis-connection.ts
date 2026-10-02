import config from '@/config/config';
import { createClient, RedisClientType } from 'redis';
const REDIS_URL = config.redis.url;

let sharedClient: RedisClientType | undefined;
let connecting: Promise<RedisClientType> | undefined;

export default async function RedisConnection(): Promise<RedisClientType> {
  if (sharedClient) return sharedClient;
  if (connecting) return connecting;

  connecting = (async () => {
    const client = createClient({ url: REDIS_URL }) as RedisClientType;

    client.on('error', (error: Error) =>
      console.error(`Redis has been disconnected cause: ${error.message}\n`, error.stack),
    );

    await client.connect();
    console.log(`✅  Redis connected to: ${REDIS_URL}`);

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
