import _ from 'lodash';
import { RedisStore } from '@/domain/entities/types/redis.types';
import { RedisClientType } from '@/domain/infrastructures/redis.interfaces';
import { isJsonValue } from '@/helpers/common.helper';

export default class RedisRepository {
  constructor(protected redis: RedisClientType) {}

  async findOne(key: string) {
    const result = (await this.redis.get(key)) as string;

    if (!result) return null;

    return isJsonValue(result) ? JSON.parse(result) : result;
  }

  async findAll(keys: string[]) {
    if (keys?.length === 0) return [];

    return await this.redis.mGet(keys).then((res) => res.map((val) => JSON.parse(val as string)));
  }

  async getAllKeys(pattern?: string) {
    return await this.redis.keys(pattern || '*');
  }

  async store(params: RedisStore) {
    let { key, value, logging = true, expired } = params;

    value = _.isString(value) ? value : JSON.stringify(value);

    const store = (await this.redis.set(key, value, { EX: expired })) as string;

    if (store?.toLowerCase() === 'ok' && logging)
      console.info(`Success save data to redis key: ${key} & value: ${JSON.stringify(value)}`);
  }

  async destroy(key: string) {
    if (await this.redis.del(key)) console.info(`Success delete data from redis key: ${key}`);
  }

  async incr(key: string) {
    return await this.redis.incr(key);
  }

  async expire(key: string, time: number) {
    return await this.redis.expire(key, time);
  }

  async getExpireInSecond(key: string) {
    return await this.redis.ttl(key);
  }
}
