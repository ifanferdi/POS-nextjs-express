import config from '@/config/config';
import RedisConnection from '@/infrastructure/redis/redis-connection';
import { randomInt } from 'crypto';
import moment from 'moment';

export async function generateOrderNumber(): Promise<string> {
  const redisClient = await RedisConnection();
  const date = moment().format('YYMMDD');
  const key = `order-counter:${date}`;

  const counter = await redisClient.incr(key);
  if (counter === 1) await redisClient.expire(key, config.redis.orderCounterRedisTimeout);

  return `INV-${date}-${String(counter).padStart(4, '0')}`;
}

export function generateOtp(digit = 6): string {
  const n = randomInt(0, 1_000_000); // 0 .. 999999
  return String(n).padStart(digit, '0');
}
