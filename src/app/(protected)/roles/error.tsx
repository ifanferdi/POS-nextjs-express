'use client';

import { Button } from '@/components/ui/button';
import { AlertCircleIcon } from 'lucide-react';
import { useEffect } from 'react';

export default function RolesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-20">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircleIcon className="size-6 text-destructive" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">Failed to load roles</p>
        <p className="text-sm text-muted-foreground">Something went wrong. Please try again.</p>
      </div>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
