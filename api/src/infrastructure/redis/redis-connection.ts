import { createClient } from 'redis';
import config from '../../config/config';

export default async function RedisConnection() {
  const REDIS_URL = config.redis.url;

  const redisClient = createClient({ url: REDIS_URL });

  redisClient.on('error', (error: Error) =>
    console.error(`Redis has been disconnected cause: ${error.message}\n`, error.stack),
  );

  if (!redisClient.isReady) {
    await redisClient.connect();
    console.log(`✅  Redis connected to: ${REDIS_URL}`);
  }

  return redisClient;
}
