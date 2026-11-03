import { RedisStore } from '@/domain/entities/types/redis.types';
import { RedisClientType } from '@/domain/infrastructures/redis.interfaces';
import { isJsonValue } from '@/helpers/common.helper';
import _ from 'lodash';

/**
 * Redis tidak punya perintah native "decrement dengan clamp" yang atomik.
 * GET lalu DECRBY terpisah bisa oversell saat request paralel (dua request membaca sisa
 * yang sama). Script ini check + decrement dalam satu langkah atomik.
 * Return jumlah unit yang di-claim, atau -1 jika key belum ada (pemanggil rebuild + retry).
 */
const CLAIM_REMAINING_SCRIPT = `
local remaining = redis.call('GET', KEYS[1])
if not remaining then return -1 end
remaining = tonumber(remaining)
local take = math.min(tonumber(ARGV[1]), remaining)
if take > 0 then redis.call('DECRBY', KEYS[1], take) end
return take
`;

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

  async storeNX(key: string, value: string, expired: number): Promise<boolean> {
    const result = await this.redis.set(key, value, { NX: true, EX: expired });
    return result === 'OK';
  }

  async destroy(key: string) {
    if (await this.redis.del(key)) console.info(`Success delete data from redis key: ${key}`);
  }

  async bulkDestroy(keys: string[]) {
    if (keys?.length === 0) return 0;

    const deleted = await this.redis.del(keys);
    if (deleted) console.info(`Success delete ${deleted} data from redis`);

    return deleted;
  }

  async incr(key: string) {
    return await this.redis.incr(key);
  }

  async incrBy(key: string, delta: number) {
    return await this.redis.incrBy(key, delta);
  }

  /** Raw GET counter; null kalau key belum ada (perlu rebuild dari tabel). */
  async getRemaining(key: string) {
    const value = await this.redis.get(key);
    return value === null ? null : Number(value);
  }

  /**
   * Claim sisa kuota secara atomik. Return jumlah unit yang berhasil di-claim,
   * atau -1 jika key belum ada (pemanggil harus rebuild dari tabel lalu retry).
   */
  async claimRemaining(key: string, qty: number) {
    const result = await this.redis.eval(CLAIM_REMAINING_SCRIPT, {
      keys: [key],
      arguments: [String(qty)],
    });

    return Number(result);
  }

  async expire(key: string, time: number) {
    return await this.redis.expire(key, time);
  }

  async getExpireInSecond(key: string) {
    return await this.redis.ttl(key);
  }
}
