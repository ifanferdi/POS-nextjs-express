'use client';

import { DashboardFilter } from '@/app/(protected)/dashboard/_components/dashboard-filter';
import { DashboardPayments } from '@/app/(protected)/dashboard/_components/dashboard-payments';
import { DashboardStatusDonut } from '@/app/(protected)/dashboard/_components/dashboard-status-donut';
import { DashboardSummaryCards } from '@/app/(protected)/dashboard/_components/dashboard-summary-cards';
import { DashboardTopProducts } from '@/app/(protected)/dashboard/_components/dashboard-top-products';
import { DashboardTrendChart } from '@/app/(protected)/dashboard/_components/dashboard-trend-chart';
import { DashboardGranularity, DashboardSummary } from '@/domain';
import { useSSE } from '@/hooks/use-sse';
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
}

export function DashboardView({ initialSummary, initialRange }: DashboardViewProps) {
  const [range, setRange] = useState(initialRange);
  const [granularity, setGranularity] = useState<DashboardGranularity>('day');
  const queryClient = useQueryClient();

  useSSE({
    events: Object.keys(SSE_WIDGETS),
    onEvent: (payload) => {
      for (const widget of SSE_WIDGETS[payload.event] ?? []) {
        queryClient.invalidateQueries({ queryKey: ['dashboard', widget] });
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Store performance overview</p>
        </div>
        <DashboardFilter
          range={range}
          granularity={granularity}
          onRangeChange={setRange}
          onGranularityChange={setGranularity}
        />
      </div>

      <DashboardSummaryCards range={range} initialData={initialSummary} />

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardTrendChart range={range} granularity={granularity} className="lg:col-span-2" />
        <DashboardStatusDonut range={range} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardPayments range={range} />
        <DashboardTopProducts range={range} />
      </div>
    </div>
  );
}
