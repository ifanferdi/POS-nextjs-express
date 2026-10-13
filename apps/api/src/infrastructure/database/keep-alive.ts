import { SUPABASE_KEEPALIVE_INTERVAL_MS } from '@/config/database.config';
import { prisma } from '@/infrastructure/database/prisma/prisma';

export function startSupabaseKeepAlive() {
  const intervalMs = SUPABASE_KEEPALIVE_INTERVAL_MS;

  const ping = async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅  Supabase keep-alive ping OK');
    } catch (err) {
      console.error('Supabase keep-alive ping failed:', err);
    }
  };

  ping();
  const timer = setInterval(ping, intervalMs);
  timer.unref?.();

  return timer;
}
