'use client';

import { CategoryActions } from '@/app/(protected)/categories/_components/category-actions';
import { CategoryDetailDialog } from '@/app/(protected)/categories/_components/category-detail-dialog';
import { CategorySearchParams } from '@/app/(protected)/categories/page';
import { TablePagination } from '@/components/shared/table';
import { DataTable, EmptyTable, ErrorTable } from '@/components/shared/table-server';
import { CategoryList } from '@/domain';
import { getAllCategoriesAction } from '@/features/categories/action';
import { categoryKeys } from '@/lib/tenstack-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { CategoryTableSkeleton } from './category-table-skeleton';

export const headers = ['#', 'Name', 'Total Products', ''];

interface categoriesTableSectionProps {
  searchParams: CategorySearchParams;
  canManage: boolean;
}
export function CategoriesTableSection(props: categoriesTableSectionProps) {
  const { searchParams, canManage } = props;

  const { page, q } = searchParams;
  const pageNum = Number(page ?? 1);
  const params = { page: pageNum, q, orderBy: ['name:asc'] };

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: categoryKeys.all(params),
    queryFn: () => getAllCategoriesAction<CategoryList>(params),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <CategoryTableSkeleton />;
  if (isError)
    return (
      <ErrorTable
        headers={headers}
        className="md:w-xl"
        entities="categories"
        onRetry={() => refetch()}
      />
    );

  const { data: categories, ...meta } = data;

  return (
    <>
      <CategoryTable categories={categories} canManage={canManage} />
      <TablePagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        baseUrl="/categories"
      />
    </>
  );
}

interface CategoryTableProps {
  categories: CategoryList[];
  canManage: boolean;
}
function CategoryTable(props: CategoryTableProps) {
  const { categories, canManage } = props;
  if (categories.length === 0)
    return (
      <EmptyTable headers={headers} className="md:w-xl" entities="categories" icon="category" />
    );

  return (
    <DataTable
      className="md:w-xl"
      headers={headers}
      records={categories}
      cells={(category) => [
        {
          key: 'name',
          type: 'custom',
          content: <CategoryDetailDialog category={category} />,
          className: 'min-w-64',
        },
        {
          key: 'products',
          type: 'custom',
          content: (
            <Link
              href={`/products?categoryId[]=${category.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors hover:underline"
            >
              <span className="font-medium">
                {category._count?.productHasCategories ?? 0} items
              </span>
              <span className="text-xs">→</span>
            </Link>
          ),
        },
        {
          key: 'action',
          type: 'custom',
          content: (
            <div className="flex justify-end gap-2">
              <CategoryActions category={category} canManage={canManage} />
            </div>
          ),
        },
      ]}
    />
  );
}
