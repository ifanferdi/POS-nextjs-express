import type { DashboardGranularity } from '@/domain';

export enum Keys {
  DASHBOARD = 'dashboard',
  PAYMENTS = 'payments',
}

export const dashboardKeys = {
  summary: ({ from, to }: { from: string; to: string }) => [Keys.DASHBOARD, 'summary', from, to],
  status: ({ from, to }: { from: string; to: string }) => [Keys.DASHBOARD, 'status', from, to],
  trend: ({
    from,
    to,
    granularity,
  }: {
    from: string;
    to: string;
    granularity: DashboardGranularity;
  }) => [Keys.DASHBOARD, 'trend', from, to, granularity],
  payments: ({ from, to }: { from: string; to: string }) => [
    Keys.DASHBOARD,
    Keys.PAYMENTS,
    from,
    to,
  ],
  topProduct: ({ from, to }: { from: string; to: string }) => [
    Keys.DASHBOARD,
    'top-products',
    from,
    to,
  ],
};
