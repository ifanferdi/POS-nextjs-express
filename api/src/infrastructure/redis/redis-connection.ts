import config from '@/config/config';
import { createClient, RedisClientType } from 'redis';
const REDIS_URL = config.redis.url;

export default async function RedisConnection() {
  const redisClient = CreateRedisConnection();

  redisClient.on('error', (error: Error) =>
    console.error(`Redis has been disconnected cause: ${error.message}\n`, error.stack),
  );

  if (!redisClient.isReady) {
    await redisClient.connect();
    console.log(`✅  Redis connected to: ${REDIS_URL}`);
  }

  return redisClient;
}

export const CreateRedisConnection = () => createClient({ url: REDIS_URL }) as RedisClientType;
