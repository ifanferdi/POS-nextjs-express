export interface RedisStore {
  key: string;
  value: Record<string, any> | string;
  logging?: boolean;
  expired?: number;
}
