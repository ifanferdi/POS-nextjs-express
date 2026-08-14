import { CategoryActions } from '@/app/(protected)/categories/_components/category-actions';
import { CategoryDetailDialog } from '@/app/(protected)/categories/_components/category-detail-dialog';
import { TablePagination } from '@/components/shared/table';
import { DataTable, EmptyTable } from '@/components/shared/table-server';
import { Category } from '@/domain';
import { getAllCategories } from '@/features/categories/api';
import { GetAllCategoryParams } from '@/features/categories/schema';

export const headers = ['#', 'Name', ''];

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
      className="md:w-lg"
      headers={headers}
      records={categories}
      cells={(category) => [
        { key: 'name', type: 'custom', content: <CategoryDetailDialog category={category} /> },
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
