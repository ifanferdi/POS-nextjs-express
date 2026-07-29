import { CategoryOption, ProductRelation } from '@/domain';
import { getAllCategories } from '@/features/categories/api';
import { GetAllProductParams } from '@/features/products/schema';
import { Suspense } from 'react';
import { ProductFilter } from './_components/product-filter';
import { ProductFormDialog } from './_components/product-form-dialog';
import { ProductSearch } from './_components/product-search';
import { ProductsTableSection } from './_components/product-table';
import { ProductTableSkeleton } from './_components/product-table-skeleton';

interface ProductsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    'categoryId[]'?: string[];
    isActive?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { page, q, isActive, ...props } = await searchParams;
  const categoryIds =
    typeof props['categoryId[]'] === 'string' ? [props['categoryId[]']] : props['categoryId[]'];

  const pageNum = Number(page ?? 1);
  const categoryIdsNum =
    categoryIds && categoryIds.length > 0 ? categoryIds.map((val) => Number(val)) : undefined;
  const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;

  const params: GetAllProductParams = {
    page: pageNum,
    q,
    categoryId: categoryIdsNum,
    isActive: isActiveBool,
    with: [ProductRelation.CATEGORIES],
  };

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
        <ProductFormDialog mode="create" categories={categories} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={null}>
          <ProductSearch />
        </Suspense>
        <Suspense fallback={null}>
          <ProductFilter categories={categories} />{' '}
        </Suspense>
      </div>
      <Suspense fallback={<ProductTableSkeleton />}>
        <ProductsTableSection categories={categories} params={params} />
      </Suspense>
    </div>
  );
}
