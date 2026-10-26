'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dashboard as dashboardConfig } from '@/config/config';
import { DashboardGranularity } from '@/domain';
import { DownloadIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const GRANULARITY_OPTIONS: { value: DashboardGranularity; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

interface DashboardFilterProps {
  range: { from: string; to: string };
  granularity: DashboardGranularity;
  onRangeChange: (range: { from: string; to: string }) => void;
  onGranularityChange: (granularity: DashboardGranularity) => void;
}

export function DashboardFilter({
  range,
  granularity,
  onRangeChange,
  onGranularityChange,
}: DashboardFilterProps) {
  const [isExporting, setIsExporting] = useState(false);

  function changeFrom(value: string) {
    // from tidak boleh melebihi to — geser to ikut
    onRangeChange({ from: value, to: value > range.to ? value : range.to });
  }

  function changeTo(value: string) {
    onRangeChange({ from: value < range.from ? value : range.from, to: value });
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ ...range, tz: dashboardConfig.timezone });
      const response = await fetch(`/api/dashboard/export?${params}`);

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Export failed.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${range.from}-to-${range.to}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        From
        <Input
          type="date"
          value={range.from}
          max={range.to}
          onChange={(e) => e.target.value && changeFrom(e.target.value)}
          className="w-38 dark:[color-scheme:dark]"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        To
        <Input
          type="date"
          value={range.to}
          min={range.from}
          onChange={(e) => e.target.value && changeTo(e.target.value)}
          className="w-38 dark:[color-scheme:dark]"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        Granularity
        <Select
          value={granularity}
          onValueChange={(v) => onGranularityChange(v as DashboardGranularity)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <Button variant="outline" onClick={handleExport} disabled={isExporting}>
        <DownloadIcon />
        {isExporting ? 'Exporting…' : 'Export CSV'}
      </Button>
    </div>
  );
}
