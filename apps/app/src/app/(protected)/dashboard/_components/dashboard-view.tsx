'use client';

import { DashboardFilter } from '@/app/(protected)/dashboard/_components/dashboard-filter';
import { DashboardPayments } from '@/app/(protected)/dashboard/_components/dashboard-payments';
import { DashboardStatusDonut } from '@/app/(protected)/dashboard/_components/dashboard-status-donut';
import { DashboardSummaryCards } from '@/app/(protected)/dashboard/_components/dashboard-summary-cards';
import { DashboardTopProducts } from '@/app/(protected)/dashboard/_components/dashboard-top-products';
import { DashboardTrendChart } from '@/app/(protected)/dashboard/_components/dashboard-trend-chart';
import { DashboardGranularity, DashboardSummary } from '@/domain';
import { useSSE } from '@/hooks/use-sse';
import { Keys } from '@/lib/tenstack-keys';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Widget yang di-refetch per SSE event — data event cuma sinyal,
 * angka final selalu diambil ulang dari REST (DB + cache backend).
 */
const SSE_WIDGETS: Record<string, string[]> = {
  'order.create': ['summary', 'trend', 'status', 'payments', 'top-products'],
  'order.status': ['summary', 'trend', 'status', 'payments'],
  'product.create': ['summary', 'top-products'],
  'product.update': ['summary', 'top-products'],
  'product.delete': ['summary', 'top-products'],
};

interface DashboardViewProps {
  initialSummary: DashboardSummary | null;
  initialRange: { from: string; to: string };
  isKasir?: boolean;
}

export function DashboardView({ initialSummary, initialRange, isKasir }: DashboardViewProps) {
  const [range, setRange] = useState(initialRange);
  const [granularity, setGranularity] = useState<DashboardGranularity>('day');
  const queryClient = useQueryClient();

  useSSE({
    events: Object.keys(SSE_WIDGETS),
    onEvent: (payload) => {
      for (const widget of SSE_WIDGETS[payload.event] ?? []) {
        queryClient.invalidateQueries({ queryKey: [Keys.DASHBOARD, widget] });
      }
    },
  });

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Store performance overview
          </p>
        </div>
        <DashboardFilter
          range={range}
          granularity={granularity}
          onRangeChange={setRange}
          onGranularityChange={setGranularity}
          isKasir={isKasir}
        />
      </div>

      <DashboardSummaryCards range={range} initialData={initialSummary} isKasir={isKasir} />

      {isKasir ? (
        <DashboardStatusDonut range={range} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <DashboardTrendChart range={range} granularity={granularity} className="lg:col-span-2" />
          <DashboardStatusDonut range={range} />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {!isKasir && <DashboardPayments range={range} />}
        <DashboardTopProducts range={range} />
      </div>
    </div>
  );
}
