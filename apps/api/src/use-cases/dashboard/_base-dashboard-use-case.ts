import config from '@/config/config';
import BaseUseCase from '@/use-cases/_base-use-case';
import { DashboardQueryDto } from '@/validations/dashboard-validation';

const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_PREFIX = 'dashboard';
const CACHE_TTL = Number(config.redis.dashboardCacheTtl) || 30;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export default abstract class DashboardBaseUseCase extends BaseUseCase {
  protected resolveRange(params: DashboardQueryDto) {
    const to = params.to ?? isoDate(new Date());
    const from = params.from ?? isoDate(new Date(Date.now() - 29 * DAY_MS));
    return { from, to, tz: params.tz };
  }

  protected shiftDays(date: string, days: number) {
    return isoDate(new Date(Date.parse(date) + days * DAY_MS));
  }

  protected daysBetween(from: string, to: string) {
    return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;
  }

  protected deltaPct(current: number, previous: number): number | null {
    return previous === 0 ? null : Math.round(((current - previous) / previous) * 100);
  }

  // Cache-aside TTL pendek; invalidasi aktif dilakukan di SSE bridge (DEL dashboard:*).
  protected async cached<T>(key: string, query: () => Promise<T>): Promise<T> {
    const cacheKey = `${CACHE_PREFIX}:${key}`;

    const cached = await this.repositories.redisRepository.findOne(cacheKey);
    if (cached !== null) return cached as T;

    const result = await query();
    await this.repositories.redisRepository.store({
      key: cacheKey,
      value: result as unknown as Record<string, any> | string,
      expired: CACHE_TTL,
      logging: false,
    });

    return result;
  }
}
