'use client';

import { Button } from '@/components/ui/button';
import { buildPageItems } from '@/lib/helper';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface UserPaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export function UserPagination({ page, totalPages, total }: UserPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    startTransition(() => {
      router.push(`/users?${params.toString()}`);
    });
  }

  if (totalPages <= 1) return null;

  const pageItems = buildPageItems(page, totalPages);

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-2 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {total} record{total !== 1 ? 's' : ''} · page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1 || isPending}
          aria-label="Previous page"
        >
          <ChevronLeftIcon />
        </Button>

        {pageItems.map((item, idx) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="flex h-7 w-7 items-center justify-center text-xs text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? 'default' : 'outline'}
              size="icon-sm"
              onClick={() => goToPage(item)}
              disabled={isPending}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages || isPending}
          aria-label="Next page"
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
