import { CategoryFormDialog } from '@/app/(protected)/categories/_components/category-form-dialog';
import { CategorySearch } from '@/app/(protected)/categories/_components/category-search';
import { CategoriesTableSection } from '@/app/(protected)/categories/_components/category-table';
import { auth } from '@/auth';
import { hasPermission, PERMISSION } from '@/lib/permission';
import { forbidden } from 'next/navigation';

export interface CategorySearchParams {
  page?: string;
  q?: string;
}

interface CategoriesPageProps {
  searchParams: Promise<CategorySearchParams>;
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_CATEGORY])) forbidden();

  const canManage = hasPermission(session?.user.permissions, [PERMISSION.MANAGE_CATEGORY]);

  return (
    <div className="space-y-6">
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
      <CategoriesTableSection searchParams={await searchParams} canManage={canManage} />
    </div>
  );
}
