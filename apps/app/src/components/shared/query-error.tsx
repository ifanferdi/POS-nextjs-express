'use client';

import { Button } from '@/components/ui/button';
import { RotateCwIcon } from 'lucide-react';

export function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-sm text-muted-foreground">Couldn&apos;t load this data.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCwIcon />
        Retry
      </Button>
    </div>
  );
}
