'use client';

import { StatusPage } from '@/components/shared/status-page';
import { Button } from '@/components/ui/button';
import { RotateCcwIcon } from 'lucide-react';
import { useEffect } from 'react';

export default function UsersError({
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
    <StatusPage
      className="min-h-[50vh]"
      code={500}
      title="Failed to load users"
      description="We couldn't fetch the user list. This is usually temporary — give it another try."
      action={
        <Button onClick={reset}>
          <RotateCcwIcon />
          Try again
        </Button>
      }
    />
  );
}
