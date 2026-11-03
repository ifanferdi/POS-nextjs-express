'use client';

import { DateRangePicker } from '@/components/shared/date-range-picker';
import { Button } from '@/components/ui/button';
import { formatDateISO } from '@/lib/helper';
import { XIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface DiscountCycleFilterProps {
  from?: string;
  to?: string;
}

export function DiscountCycleFilter({ from, to }: DiscountCycleFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function pushRange(next?: { from?: string; to?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    if (next?.from) params.set('from', next?.from);
    else params.delete('from');

    if (next?.to) params.set('to', next?.to);
    else params.delete('to');

    startTransition(() => router.push(`/product-discount-cycles?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      {(from || to) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 hover:text-destructive hover:bg-destructive/10! dark:hover:bg-destructive/20!"
          onClick={() => pushRange()}
        >
          <XIcon />
          Clear filter
        </Button>
      )}
      <DateRangePicker
        key={`${from ?? ''}-${to ?? ''}`}
        showCompare={false}
        showPreset={false}
        initialDateFrom={from ?? new Date()}
        initialDateTo={to}
        onUpdate={({ range }) =>
          pushRange({
            from: formatDateISO(range.from),
            to: range.to ? formatDateISO(range.to) : undefined,
          })
        }
      />
    </div>
  );
}
