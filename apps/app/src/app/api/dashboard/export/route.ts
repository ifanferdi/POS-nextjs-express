import { auth } from '@/auth';
import { api as apiConfig, dashboard as dashboardConfig } from '@/config/config';
import { DashboardRangeSchema } from '@/features/dashboard/schema';
import { getDefaultDateRange } from '@/lib/helper';
import { NextRequest } from 'next/server';

/**
 * Proxy export CSV: client tidak punya access token, jadi fetch backend
 * di server (seperti SSE proxy) lalu teruskan stream ke browser.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) return new Response('Unauthorized', { status: 401 });

  const fallback = getDefaultDateRange(dashboardConfig.timezone);
  const parsed = DashboardRangeSchema.safeParse({
    from: request.nextUrl.searchParams.get('from') ?? fallback.from,
    to: request.nextUrl.searchParams.get('to') ?? fallback.to,
    tz: request.nextUrl.searchParams.get('tz') ?? dashboardConfig.timezone,
  });
  if (!parsed.success) return new Response('Invalid filter.', { status: 400 });

  const backendRes = await fetch(
    `${apiConfig.baseUrl}/v1/dashboard/orders/export?${new URLSearchParams(parsed.data)}`,
    { headers: { Authorization: `Bearer ${session.accessToken}` } },
  );

  if (!backendRes.ok || !backendRes.body) {
    return Response.json(
      { message: 'Failed to export orders.' },
      { status: backendRes.status || 502 },
    );
  }

  return new Response(backendRes.body, {
    headers: {
      'Content-Type': backendRes.headers.get('content-type') ?? 'text/csv',
      'Content-Disposition':
        backendRes.headers.get('content-disposition') ?? 'attachment; filename="orders.csv"',
    },
  });
}
