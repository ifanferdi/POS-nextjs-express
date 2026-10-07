'use client';

import { StatusPage } from '@/components/shared/status-page';
import { Button } from '@/components/ui/button';
import { HomeIcon, RotateCcwIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AppError({
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
      code={500}
      title="Something went wrong"
      description="An unexpected error occurred while loading this page. You can retry, or head back to the dashboard."
      action={
        <>
          <Button onClick={reset}>
            <RotateCcwIcon />
            Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <HomeIcon />
              Back to dashboard
            </Link>
          </Button>
        </>
      }
    />
  );
}
