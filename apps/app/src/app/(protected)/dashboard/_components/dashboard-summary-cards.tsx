'use client';

import { QueryError } from '@/components/shared/query-error';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard as dashboardConfig } from '@/config/config';
import { DashboardSummary } from '@/domain';
import { getDashboardSummaryAction } from '@/features/dashboard/action';
import { formatCurrency } from '@/lib/helper';
import { dashboardKeys } from '@/lib/tenstack-keys';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BanknoteIcon,
  BoxIcon,
  LucideIcon,
  ReceiptTextIcon,
  ShoppingCartIcon,
} from 'lucide-react';

const TZ = dashboardConfig.timezone;

type MetricKey = 'totalOrders' | 'totalRevenue' | 'avgOrderValue' | 'totalProducts';

const METRICS: {
  key: MetricKey;
  label: string;
  icon: LucideIcon;
  format: (n: number) => string;
}[] = [
  { key: 'totalOrders', label: 'Total Orders', icon: ShoppingCartIcon, format: String },
  {
    key: 'totalRevenue',
    label: 'Revenue',
    icon: BanknoteIcon,
    format: (n) => formatCurrency(n, 0),
  },
  {
    key: 'avgOrderValue',
    label: 'Avg Order Value',
    icon: ReceiptTextIcon,
    format: (n) => formatCurrency(n, 0),
  },
  { key: 'totalProducts', label: 'Total Products', icon: BoxIcon, format: String },
];

function DeltaChip({ value }: { value: number | null | undefined }) {
  if (value == null) {
    return <span className="text-xs text-muted-foreground">— vs previous period</span>;
  }

  const positive = value >= 0;
  const Icon = positive ? ArrowUpRightIcon : ArrowDownRightIcon;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${positive ? 'text-success' : 'text-destructive'}`}
    >
      <Icon className="size-3.5" />
      {positive ? '+' : ''}
      {value}%<span className="font-normal text-muted-foreground"> vs previous period</span>
    </span>
  );
}

interface DashboardSummaryCardsProps {
  range: { from: string; to: string };
  initialData?: DashboardSummary | null;
}

export function DashboardSummaryCards({ range, initialData }: DashboardSummaryCardsProps) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: dashboardKeys.summary(range),
    queryFn: () => getDashboardSummaryAction({ ...range, tz: TZ }),
    initialData: initialData ?? undefined,
  });

  if (isError) return <QueryError onRetry={() => refetch()} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {METRICS.map((metric) => (
        <Card key={metric.key}>
          <CardContent className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              {metric.label}
              <metric.icon className="size-4 text-muted-foreground" />
            </div>
            {isPending || !data ? (
              <Skeleton className="mt-1 h-8 w-28" />
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums tracking-tight">
                  {metric.format(data[metric.key])}
                </div>
                <DeltaChip value={data.delta[metric.key]} />
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
