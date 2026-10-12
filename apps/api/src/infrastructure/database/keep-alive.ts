import { prisma } from '@/infrastructure/database/prisma/prisma';

const DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 jam

// ponytail: cegah Supabase free tier di-pause (>7 hari idle) dengan ping berkala.
export function startSupabaseKeepAlive() {
  const intervalMs = Number(process.env.SUPABASE_KEEPALIVE_INTERVAL_MS) || DEFAULT_INTERVAL_MS;

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
