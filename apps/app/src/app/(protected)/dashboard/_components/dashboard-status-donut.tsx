'use client';

import { QueryError } from '@/components/shared/query-error';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard as dashboardConfig } from '@/config/config';
import { DashboardStatusCount, OrderStatus } from '@/domain';
import { getDashboardOrdersByStatusAction } from '@/features/dashboard/action';
import { dashboardKeys } from '@/lib/tenstack-keys';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

const TZ = dashboardConfig.timezone;

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.COMPLETED]: 'var(--chart-1)',
  [OrderStatus.PAID]: 'var(--chart-2)',
  [OrderStatus.PENDING]: 'var(--chart-3)',
  [OrderStatus.CANCELLED]: 'var(--chart-4)',
  [OrderStatus.EXPIRED]: 'var(--chart-5)',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.COMPLETED]: 'Completed',
  [OrderStatus.PAID]: 'Paid',
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.EXPIRED]: 'Expired',
};

const R = 54;
const CIRCUMFERENCE = 2 * Math.PI * R;

interface DashboardStatusDonutProps {
  range: { from: string; to: string };
}

export function DashboardStatusDonut({ range }: DashboardStatusDonutProps) {
  const [active, setActive] = useState<OrderStatus | null>(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: dashboardKeys.status(range),
    queryFn: () => getDashboardOrdersByStatusAction({ ...range, tz: TZ }),
  });

  const rows = useMemo(
    () =>
      (data ?? [])
        .filter((r) => r.count > 0)
        .sort((a, b) => b.count - a.count) as DashboardStatusCount[],
    [data],
  );

  const total = rows.reduce((sum, r) => sum + r.count, 0);

  const segments = useMemo(() => {
    const lengths = rows.map((row) => (row.count / total) * CIRCUMFERENCE);
    const offsets = lengths.reduce<number[]>(
      (acc, length) => [...acc, (acc[acc.length - 1] ?? 0) + length],
      [0],
    );
    return rows.map((row, i) => ({ ...row, length: lengths[i], offset: offsets[i] }));
  }, [rows, total]);

  const activeRow = segments.find((segment) => segment.status === active) ?? null;
  const activePercent = activeRow ? Math.round((activeRow.count / total) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Orders by Status</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {isPending ? (
          <Skeleton className="h-56 w-full" />
        ) : isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : total === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
            No orders in this period.
          </div>
        ) : (
          <>
            <div className="relative mx-auto size-44">
              <svg
                viewBox="0 0 140 140"
                className="block size-full -rotate-90"
                role="img"
                aria-label="Orders by status"
              >
                {segments.map((segment) => {
                  const isActive = active === segment.status;
                  const isDimmed = active !== null && !isActive;
                  return (
                    <circle
                      key={segment.status}
                      cx="70"
                      cy="70"
                      r={R}
                      fill="none"
                      stroke={STATUS_COLORS[segment.status]}
                      strokeWidth={isActive ? 20 : 16}
                      strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
                      strokeDashoffset={-segment.offset}
                      className={cn('transition-all duration-150', isDimmed && 'opacity-50')}
                      onMouseEnter={() => setActive(segment.status)}
                      onMouseLeave={() => setActive(null)}
                    />
                  );
                })}
              </svg>
              <div
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-3 text-center"
                aria-live="polite"
              >
                {activeRow ? (
                  <>
                    <span className="text-xs font-medium text-muted-foreground">
                      {STATUS_LABELS[activeRow.status]}
                    </span>
                    <span className="text-2xl font-bold tabular-nums tracking-tight">
                      {activeRow.count}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {activePercent}%
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-bold tabular-nums tracking-tight">{total}</span>
                    <span className="text-xs text-muted-foreground">orders</span>
                  </>
                )}
              </div>
            </div>

            <ul className="space-y-1">
              {segments.map((segment) => (
                <li
                  key={segment.status}
                  className={`flex cursor-pointer items-center gap-2 rounded-md mx-0 px-2 ${active === segment.status ? 'bg-primary/30' : ''} py-1.5 mb-0 text-sm focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none`}
                  tabIndex={0}
                  onMouseEnter={() => setActive(segment.status)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(segment.status)}
                  onBlur={() => setActive(null)}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[segment.status] }}
                  />
                  <span className="flex-1">{STATUS_LABELS[segment.status]}</span>
                  <span className="font-medium tabular-nums">{segment.count}</span>
                  <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                    {Math.round((segment.count / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
