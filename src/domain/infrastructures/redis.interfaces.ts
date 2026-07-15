import RedisConnection from '../../infrastructure/redis/redis-connection';

export type RedisClientType = Awaited<ReturnType<typeof RedisConnection>>;
