import { DashboardView } from '@/app/(protected)/dashboard/_components/dashboard-view';
import { dashboard as dashboardConfig } from '@/config/config';
import { DashboardSummary } from '@/domain';
import { getDashboardSummary } from '@/features/dashboard/api';
import { getDefaultDateRange } from '@/lib/helper';
import { unstable_rethrow } from 'next/navigation';

export default async function DashboardPage() {
  // Summary di-SSR supaya first paint langsung ada angka; widget interaktif di client.
  const tz = dashboardConfig.timezone;
  const range = getDefaultDateRange(tz, dashboardConfig.defaultRangeDays);

  let initialSummary: DashboardSummary | null;
  try {
    initialSummary = await getDashboardSummary({ ...range, tz });
  } catch (error) {
    // Biarkan redirect 401 tetap jalan; error lain jatuh ke retry di client.
    unstable_rethrow(error);
    initialSummary = null;
  }

  return <DashboardView initialSummary={initialSummary} initialRange={range} />;
}
