import { CategoryFormDialog } from '@/app/(protected)/categories/_components/category-form-dialog';
import { CategorySearch } from '@/app/(protected)/categories/_components/category-search';
import {
  CategoriesTableSection,
  headers,
} from '@/app/(protected)/categories/_components/category-table';
import { CategoryTableSkeleton } from '@/app/(protected)/categories/_components/category-table-skeleton';
import { auth } from '@/auth';
import { ParamsError } from '@/components/shared/error';
import { ErrorTable } from '@/components/shared/table-server';
import { GetAllCategorySchema } from '@/features/categories/schema';
import { hasPermission, PERMISSION } from '@/lib/permission';
import { forbidden } from 'next/navigation';
import { Suspense } from 'react';
import { z } from 'zod';

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
}) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_CATEGORY])) forbidden();

  const canManage = hasPermission(session?.user.permissions, [PERMISSION.MANAGE_CATEGORY]);

  const { page, q } = await searchParams;
  const result = GetAllCategorySchema.safeParse({
    page: Number(page ?? 1),
    q,
    orderBy: ['name:asc'],
  });

  return (
    <div className="space-y-6">
      {!result.success && <ParamsError errors={z.flattenError(result.error).fieldErrors} />}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your application categories</p>
        </div>
        {canManage && <CategoryFormDialog mode="create" />}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CategorySearch />
      </div>
      {result.success ? (
        <Suspense fallback={<CategoryTableSkeleton />}>
          <CategoriesTableSection params={result.data} canManage={canManage} />
        </Suspense>
      ) : (
        <ErrorTable headers={headers} recoveryHref="/categories" />
      )}
    </div>
  );
}
