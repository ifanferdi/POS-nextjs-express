'use client';

import { DashboardCardError } from '@/app/(protected)/dashboard/_components/dashboard-card-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard as dashboardConfig } from '@/config/config';
import { getPaymentMethod, PaymentMethod, PaymentStatus } from '@/domain';
import { getDashboardPaymentsAction } from '@/features/dashboard/action';
import { formatCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

const TZ = dashboardConfig.timezone;

const METHOD_COLORS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'var(--chart-3)',
  [PaymentMethod.QRIS]: 'var(--chart-1)',
  [PaymentMethod.VA_BCA]: 'var(--chart-2)',
  [PaymentMethod.VA_BNI]: 'var(--chart-4)',
  [PaymentMethod.VA_BRI]: 'var(--chart-5)',
  [PaymentMethod.VA_MANDIRI]: 'oklch(0.58 0.14 300)',
};

const CENTER = 100;
const PIE_RADIUS = 84;
// Jarak slice "meledak" saat hover — sisakan ruang di viewBox
const EXPLODE = 5;

function polar(angle: number, radius: number) {
  const rad = ((angle - 90) * Math.PI) / 180; // mulai dari jam 12, searah jarum jam
  const round = (n: number) => Math.round(n * 100) / 100;
  return { x: round(CENTER + radius * Math.cos(rad)), y: round(CENTER + radius * Math.sin(rad)) };
}

function slicePath(start: number, end: number) {
  const from = polar(start, PIE_RADIUS);
  const to = polar(end, PIE_RADIUS);
  const largeArc = end - start > 180 ? 1 : 0;
  return [
    `M ${CENTER} ${CENTER}`,
    `L ${from.x} ${from.y}`,
    `A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArc} 1 ${to.x} ${to.y}`,
    'Z',
  ].join(' ');
}

interface DashboardPaymentsProps {
  range: { from: string; to: string };
}

export function DashboardPayments({ range }: DashboardPaymentsProps) {
  const [active, setActive] = useState<PaymentMethod | null>(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'payments', range.from, range.to],
    queryFn: () => getDashboardPaymentsAction({ ...range, tz: TZ }),
  });

  const rows = useMemo(() => {
    const byMethod = new Map<PaymentMethod, { count: number; amount: number }>();
    for (const payment of data ?? []) {
      if (payment.status !== PaymentStatus.SUCCESS) continue;
      const current = byMethod.get(payment.method) ?? { count: 0, amount: 0 };
      current.count += payment.count;
      current.amount += payment.amount;
      byMethod.set(payment.method, current);
    }
    return [...byMethod.entries()]
      .map(([method, value]) => ({ method, ...value }))
      .sort((a, b) => b.amount - a.amount);
  }, [data]);

  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
  const totalCount = rows.reduce((sum, row) => sum + row.count, 0);

  const segments = useMemo(() => {
    const angles = rows.map((row) => (row.amount / totalAmount) * 360);
    const starts = angles.reduce<number[]>(
      (acc, angle) => [...acc, (acc[acc.length - 1] ?? 0) + angle],
      [0],
    );
    return rows.map((row, i) => {
      const mid = starts[i] + angles[i] / 2;
      const midRad = ((mid - 90) * Math.PI) / 180;
      const round = (n: number) => Math.round(n * 100) / 100;
      return {
        ...row,
        start: starts[i],
        end: starts[i] + angles[i],
        explodeX: round(Math.cos(midRad) * EXPLODE),
        explodeY: round(Math.sin(midRad) * EXPLODE),
      };
    });
  }, [rows, totalAmount]);

  const activeRow = segments.find((segment) => segment.method === active) ?? null;
  const activePercent = activeRow ? Math.round((activeRow.amount / totalAmount) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Payments</CardTitle>
        <CardDescription>Successful payments by method</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <DashboardCardError onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
            No successful payments in this period.
          </div>
        ) : (
          <>
            <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
              {activeRow ? (
                <>
                  {getPaymentMethod(activeRow.method)}
                  {' · '}
                  <span className="font-medium text-foreground">
                    {formatCurrency(activeRow.amount, 0)}
                  </span>
                  {' · '}
                  {totalCount} order{totalCount === 1 ? '' : 's'} · {activePercent}%
                </>
              ) : (
                <>
                  Total{' · '}
                  <span className="font-medium text-foreground">
                    {formatCurrency(totalAmount, 0)}
                  </span>
                  {' · '}
                  {totalCount} order{totalCount === 1 ? '' : 's'}
                </>
              )}
            </p>

            <svg
              viewBox="0 0 200 200"
              className="mx-auto block size-52"
              role="img"
              aria-label="Payments by method"
            >
              {segments.map((segment) => {
                const isActive = active === segment.method;
                const isDimmed = active !== null && !isActive;
                const isFull = segment.end - segment.start >= 359.5;
                const style = isActive
                  ? { transform: `translate(${segment.explodeX}px, ${segment.explodeY}px)` }
                  : undefined;
                const className = cn('transition-all duration-150', isDimmed && 'opacity-50');
                const handlers = {
                  onMouseEnter: () => setActive(segment.method),
                  onMouseLeave: () => setActive(null),
                };

                // Slice 100% (1 metode) tidak bisa digambar sebagai arc — pakai lingkaran penuh
                return isFull ? (
                  <circle
                    key={segment.method}
                    cx={CENTER}
                    cy={CENTER}
                    r={PIE_RADIUS}
                    fill={METHOD_COLORS[segment.method]}
                    stroke="var(--card)"
                    strokeWidth="2"
                    style={style}
                    className={className}
                    {...handlers}
                  />
                ) : (
                  <path
                    key={segment.method}
                    d={slicePath(segment.start, segment.end)}
                    fill={METHOD_COLORS[segment.method]}
                    stroke="var(--card)"
                    strokeWidth="2"
                    style={style}
                    className={className}
                    {...handlers}
                  />
                );
              })}
            </svg>

            <ul className="space-y-1">
              {segments.map((segment) => (
                <li
                  key={segment.method}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-2 ${active === segment.method ? 'bg-primary/30' : ''} py-1.5 mb-0 text-sm focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none`}
                  tabIndex={0}
                  onMouseEnter={() => setActive(segment.method)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(segment.method)}
                  onBlur={() => setActive(null)}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: METHOD_COLORS[segment.method] }}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {getPaymentMethod(segment.method)}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCurrency(segment.amount, 0)}
                  </span>
                  <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {Math.round((segment.amount / totalAmount) * 100)}%
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
