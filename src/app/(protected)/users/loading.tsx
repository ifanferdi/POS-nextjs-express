import { Skeleton } from '@/components/ui/skeleton';

export default function UsersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full sm:w-72" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border/60">
        <Skeleton className="h-10 w-full rounded-none bg-muted/40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}
