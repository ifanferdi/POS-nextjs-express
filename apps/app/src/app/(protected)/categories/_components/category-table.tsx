import { CategoryActions } from '@/app/(protected)/categories/_components/category-actions';
import { CategoryDetailDialog } from '@/app/(protected)/categories/_components/category-detail-dialog';
import { TablePagination } from '@/components/shared/table';
import { DataTable, EmptyTable } from '@/components/shared/table-server';
import { CategoryList } from '@/domain';
import { getAllCategories } from '@/features/categories/api';
import { GetAllCategoryParams } from '@/features/categories/schema';
import Link from 'next/link';

export const headers = ['#', 'Name', 'Total Products', ''];

interface categoriesTableSectionProps {
  params: GetAllCategoryParams;
  canManage: boolean;
}
export async function CategoriesTableSection(props: categoriesTableSectionProps) {
  const { params, canManage } = props;
  const { data: categories, ...meta } = await getAllCategories<CategoryList>(params);
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
