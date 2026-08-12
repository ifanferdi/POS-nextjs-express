import { Skeleton } from '@/components/ui/skeleton';

export function PosProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="space-y-2">
        <Skeleton className="h-8 w-full rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
          <div className="flex flex-1 gap-1.5 overflow-hidden">
            <Skeleton className="h-6 w-14 shrink-0 rounded-full" />
            <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
            <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
            <Skeleton className="h-6 w-18 shrink-0 rounded-full" />
            <Skeleton className="h-6 w-12 shrink-0 rounded-full" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-lg border border-border/60"
            >
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="flex flex-1 flex-col gap-1.5 p-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="mt-1 h-7 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
