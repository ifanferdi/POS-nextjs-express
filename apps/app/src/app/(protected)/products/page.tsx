import { ProductFilter } from '@/app/(protected)/products/_components/product-filter';
import { ProductFormDialog } from '@/app/(protected)/products/_components/product-form-dialog';
import { ProductSearch } from '@/app/(protected)/products/_components/product-search';
import { ProductTableSection } from '@/app/(protected)/products/_components/product-table';
import { auth } from '@/auth';
import { CategoryOption } from '@/domain';
import { getAllCategories } from '@/features/categories/api';
import { hasPermission, PERMISSION } from '@/lib/permission';
import { forbidden } from 'next/navigation';

export interface ProductSearchParams {
  page?: string;
  q?: string;
  'categoryId[]'?: string[];
  isActive?: string;
}
 interface ProductsPageProps {
  searchParams: Promise<ProductSearchParams>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_PRODUCT])) forbidden();

  const canManage = hasPermission(session?.user.permissions, [PERMISSION.MANAGE_PRODUCT]);

  const { data: categories } = await getAllCategories<CategoryOption>({
    limit: -1,
    columns: ['id', 'name'],
    orderBy: ['name:asc'],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your application products</p>
        </div>
        {canManage && <ProductFormDialog mode="create" categories={categories} />}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ProductSearch />
        <ProductFilter categories={categories} />{' '}
      </div>
      <ProductTableSection
        categories={categories}
        searchParams={await searchParams}
        canManage={canManage}
      />
    </div>
  );
}
