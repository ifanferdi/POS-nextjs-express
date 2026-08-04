import { CategoryFormDialog } from '@/app/(protected)/categories/_components/category-form-dialog';
import { CategorySearch } from '@/app/(protected)/categories/_components/category-search';
import { CategoriesTableSection } from '@/app/(protected)/categories/_components/category-table';
import { CategoryTableSkeleton } from '@/app/(protected)/categories/_components/category-table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { GetAllCategoryParams } from '@/features/categories/schema';
import { Suspense } from 'react';

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page, q } = await searchParams;
  const pageNum = Number(page ?? 1);
  const params: GetAllCategoryParams = { page: pageNum, q };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your application categories</p>
        </div>
        <CategoryFormDialog mode="create" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={<Skeleton className="h-9 w-full sm:w-72" />}>
          <CategorySearch />
        </Suspense>
      </div>
      <Suspense fallback={<CategoryTableSkeleton />}>
        <CategoriesTableSection params={params} />
      </Suspense>
    </div>
  );
}
