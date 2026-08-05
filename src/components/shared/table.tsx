'use client';
import { Button } from '@/components/ui/button';
import { icons } from '@/config/config';
import { buildPageItems } from '@/lib/helper';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Skeleton as SkeletonComponent } from '../ui/skeleton';

interface SkeletonProps {
  className?: string;
  total?: number;
}
export function Skeleton({ className, total }: SkeletonProps) {
  return (
    <SkeletonComponent
      key={total}
      className={`bg-muted-foreground/20 dark:bg-muted ${className}`}
    />
  );
}

export function ActionSkeleton({ className, total = 1 }: SkeletonProps) {
  return (
    <div className="flex justify-end gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <Skeleton key={total} className={`size-8 rounded-full ${className}`} />
      ))}
    </div>
  );
}

interface TablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  baseUrl: string;
}
export function TablePagination({ page, totalPages, total, baseUrl }: TablePaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function goToPage(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    startTransition(() => {
      router.push(`${baseUrl}?${params.toString()}`);
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

export function EmptyTable({ entities, icon }: { entities: string; icon: keyof typeof icons }) {
  const Icon = icons[icon];
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No {entities} found</p>
      <p className="mt-1 text-sm text-muted-foreground">Try to add new data.</p>
    </div>
  );
}
