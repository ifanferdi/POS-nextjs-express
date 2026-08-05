import { CategoryActions } from '@/app/(protected)/categories/_components/category-actions';
import { CategoryDetailDialog } from '@/app/(protected)/categories/_components/category-detail-dialog';
import { EmptyTable, TablePagination } from '@/components/shared/table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Category } from '@/domain';
import { getAllCategories } from '@/features/categories/api';
import { GetAllCategoryParams } from '@/features/categories/schema';

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
    <div className="overflow-hidden rounded-lg border border-border/60 md:w-lg">
      <Table>
        <CategoryTableHeader />
        <TableBody>
          {categories.map((category, index) => (
            <TableRow key={category.id} className="group">
              <TableCell className="text-muted-foreground text-center">{index + 1}</TableCell>
              <TableCell>
                <CategoryDetailDialog category={category} />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <CategoryActions category={category} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function CategoryTableHeader() {
  const HEADERS = ['#', 'Name'];
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        {HEADERS.map((header) => (
          <TableHead
            key={header}
            className={`text-xs text-muted-foreground ${header === '#' ? 'w-0 px-3 text-center' : ''}`}
          >
            {header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
