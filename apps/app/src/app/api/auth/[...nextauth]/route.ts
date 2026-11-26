import { handlers } from '@/auth';
import { app as config } from '@/config/config';
import type { NextRequest } from 'next/server';

const isProduction = config.env.toLowerCase() === 'production';
const sessionPath = '/api/auth/session';

/**
 * Nonaktifkan endpoint GET/POST /api/auth/session di production.
 * Sesi di sisi server memakai auth() langsung, bukan HTTP endpoint ini.
 */
function blockSessionInProduction(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest) => {
    if (isProduction && new URL(req.url).pathname.endsWith(sessionPath))
      return new Response(null, { status: 404 });

    return handler(req);
  };
}

export const GET = blockSessionInProduction(handlers.GET);
export const POST = blockSessionInProduction(handlers.POST);
