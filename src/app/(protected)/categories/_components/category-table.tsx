import { CategoryActions } from '@/app/(protected)/categories/_components/category-actions';
import { CategoryDetailDialog } from '@/app/(protected)/categories/_components/category-detail-dialog';
import { TablePagination } from '@/components/shared/table';
import { DataTable, EmptyTable } from '@/components/shared/table-server';
import { Category } from '@/domain';
import { getAllCategories } from '@/features/categories/api';
import { GetAllCategoryParams } from '@/features/categories/schema';
import Link from 'next/link';

export const headers = ['#', 'Name', 'Total Products', ''];

interface categoriesTableSectionProps {
  params: GetAllCategoryParams;
}
export async function CategoriesTableSection(props: categoriesTableSectionProps) {
  const { params } = props;
  const { data: categories, ...meta } = await getAllCategories(params);
  return (
    <>
      <CategoryTable categories={categories} />
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
  categories: Category[];
}
function CategoryTable(props: CategoryTableProps) {
  const { categories } = props;
  if (categories.length === 0) return <EmptyTable entities="categories" icon="category" />;

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
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <span className="font-medium">{category._count?.productHasCategories ?? 0}</span>
              <span className="text-xs">→</span>
            </Link>
          ),
        },
        {
          key: 'action',
          type: 'custom',
          content: (
            <div className="flex justify-end gap-2">
              <CategoryActions category={category} />
            </div>
          ),
        },
      ]}
    />
  );
}
