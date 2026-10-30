export enum Keys {
  DASHBOARD = 'dashboard',
  PAYMENTS = 'payments',
}

export const dashboardKeys = {
  summary: ({ from, to }: { from: string; to: string }) => [Keys.DASHBOARD, 'summary', from, to],
  status: ({ from, to }: { from: string; to: string }) => [Keys.DASHBOARD, 'status', from, to],
  trend: ({ from, to }: { from: string; to: string }) => [Keys.DASHBOARD, 'trend', from, to],
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
