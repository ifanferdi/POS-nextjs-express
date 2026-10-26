'use client';

import { DashboardCardError } from '@/app/(protected)/dashboard/_components/dashboard-card-error';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard as dashboardConfig } from '@/config/config';
import { DashboardGranularity } from '@/domain';
import { getDashboardTrendAction } from '@/features/dashboard/action';
import { formatCompactCurrency, formatCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useMemo, useRef, useState } from 'react';

const TZ = dashboardConfig.timezone;

const W = 720;
const H = 260;
const PAD = { left: 52, right: 12, top: 16, bottom: 30 };
const PLOT = {
  x0: PAD.left,
  x1: W - PAD.right,
  y0: PAD.top,
  y1: H - PAD.bottom,
};

type Metric = 'revenue' | 'orders';

const METRIC_COLOR: Record<Metric, string> = {
  revenue: 'var(--chart-1)',
  orders: 'var(--chart-5)',
};

function bucketLabel(bucket: string, granularity: DashboardGranularity) {
  return moment(bucket).format(granularity === 'month' ? 'MMM YYYY' : 'D MMM');
}

function tickLabel(value: number, metric: Metric) {
  return metric === 'revenue' ? formatCompactCurrency(value) : String(Math.round(value));
}

interface DashboardTrendChartProps {
  range: { from: string; to: string };
  granularity: DashboardGranularity;
  className?: string;
}

export function DashboardTrendChart({ range, granularity, className }: DashboardTrendChartProps) {
  const [metric, setMetric] = useState<Metric>('revenue');
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'trend', range.from, range.to, granularity],
    queryFn: () => getDashboardTrendAction({ ...range, granularity, tz: TZ }),
  });

  const points = useMemo(() => data ?? [], [data]);
  const maxValue = useMemo(() => Math.max(...points.map((p) => p[metric]), 1), [points, metric]);

  const x = (i: number) =>
    points.length === 1
      ? (PLOT.x0 + PLOT.x1) / 2
      : PLOT.x0 + (i * (PLOT.x1 - PLOT.x0)) / (points.length - 1);
  const y = (value: number) => PLOT.y1 - (value / maxValue) * (PLOT.y1 - PLOT.y0);

  const linePath = useMemo(
    () => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p[metric])}`).join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, metric],
  );
  const areaPath = `${linePath}L${x(points.length - 1)},${PLOT.y1}L${x(0)},${PLOT.y1}Z`;

  const xTicks = useMemo(() => {
    if (points.length === 0) return [];
    const indexes = new Set<number>();
    for (let i = 0; i <= 5; i++) {
      indexes.add(Math.round((i * (points.length - 1)) / 5));
    }
    return [...indexes];
  }, [points.length]);

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return;
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setHover(Math.round(ratio * (points.length - 1)));
  }

  // Hover bisa basi setelah refetch dengan data lebih pendek — jaga index tetap dalam range.
  const safeHover = hover !== null && hover < points.length ? hover : null;
  const activeIndex = safeHover ?? points.length - 1;
  const active = points[activeIndex];
  const activeColor = METRIC_COLOR[metric];

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle>Sales Trend</CardTitle>
        <CardAction className="flex gap-1">
          {(['revenue', 'orders'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
              className={cn(
                'h-7 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                metric === m
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {m === 'revenue' ? 'Revenue' : 'Orders'}
            </button>
          ))}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        {isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <DashboardCardError onRetry={() => refetch()} />
        ) : points.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
            No sales in this period.
          </div>
        ) : (
          <>
            <p className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
              {bucketLabel(active.bucket, granularity)}
              <span className="text-foreground"> · {active.orders} orders</span> ·{' '}
              {formatCurrency(active.revenue, 0)}
            </p>
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="block h-auto w-full"
              role="img"
              aria-label={`${metric === 'revenue' ? 'Revenue' : 'Orders'} trend from ${range.from} to ${range.to}`}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHover(null)}
            >
              <defs>
                <linearGradient id="dashboard-trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeColor} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={activeColor} stopOpacity="0" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                const value = maxValue * fraction;
                const gy = y(value);
                return (
                  <g key={fraction}>
                    <line
                      x1={PLOT.x0}
                      x2={PLOT.x1}
                      y1={gy}
                      y2={gy}
                      stroke="var(--border)"
                      strokeWidth="1"
                    />
                    <text
                      x={PLOT.x0 - 8}
                      y={gy + 3}
                      textAnchor="end"
                      className="fill-muted-foreground text-[10px] tabular-nums"
                    >
                      {tickLabel(value, metric)}
                    </text>
                  </g>
                );
              })}

              {xTicks.map((i) => (
                <text
                  key={i}
                  x={x(i)}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px] tabular-nums"
                >
                  {bucketLabel(points[i].bucket, granularity)}
                </text>
              ))}

              {points.length > 1 && (
                <>
                  <path d={areaPath} fill="url(#dashboard-trend-fill)" />
                  <path
                    key={`${metric}-${range.from}-${range.to}-${granularity}`}
                    d={linePath}
                    fill="none"
                    stroke={activeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    className="dashboard-draw"
                  />
                </>
              )}

              {safeHover !== null && (
                <line
                  x1={x(safeHover)}
                  x2={x(safeHover)}
                  y1={PLOT.y0}
                  y2={PLOT.y1}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
              )}

              {safeHover !== null && (
                <circle
                  cx={x(safeHover)}
                  cy={y(points[safeHover][metric])}
                  r="4.5"
                  fill={activeColor}
                  stroke="var(--card)"
                  strokeWidth="2"
                />
              )}

              {/* Titik akhir "live" — ikut ter-update tiap SSE */}
              <circle
                cx={x(points.length - 1)}
                cy={y(points[points.length - 1][metric])}
                r="11"
                fill={activeColor}
                opacity="0.25"
                className="motion-safe:animate-pulse"
              />
              <circle
                cx={x(points.length - 1)}
                cy={y(points[points.length - 1][metric])}
                r="4.5"
                fill={activeColor}
                stroke="var(--card)"
                strokeWidth="2"
              />
            </svg>
          </>
        )}
      </CardContent>
    </Card>
  );
}
