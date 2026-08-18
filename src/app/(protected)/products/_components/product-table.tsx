import { ProductActions } from '@/app/(protected)/products/_components/product-actions';
import { TablePagination } from '@/components/shared/table';
import { DataTable, EmptyTable, TooltipedCell } from '@/components/shared/table-server';
import { Badge } from '@/components/ui/badge';
import { CategoryOption, Product } from '@/domain';
import { getAllProducts } from '@/features/products/api';
import { GetAllProductParams } from '@/features/products/schema';
import { formatCurrency } from '@/lib/helper';

export const headers = ['#', 'Name', 'Sku', 'Stock', 'Price', 'Categories', 'Is Active?', ''];

interface ProductTableSectionProps {
  params: GetAllProductParams;
  categories: CategoryOption[];
}
export async function ProductTableSection(props: ProductTableSectionProps) {
  const { params, categories } = props;
  const { data: products, ...meta } = await getAllProducts(params);
  return (
    <>
      <ProductTable products={products} categories={categories} />
      <TablePagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        baseUrl="/products"
      />
    </>
  );
}

interface ProductTableProps {
  products: Product[];
  categories: CategoryOption[];
}
function ProductTable(props: ProductTableProps) {
  const { products, categories } = props;
  if (products.length === 0) return <EmptyTable entities="products" icon="product" />;

  return (
    <DataTable
      headers={headers}
      records={products}
      cells={(product) => [
        {
          key: 'fullname',
          type: 'link',
          url: `/products/${product.id}`,
          content: TooltipedCell(product.name),
        },
        { key: 'sku', content: product.sku === '' ? '-' : product.sku },
        { key: 'stock', content: `${product.stock} item` },
        { key: 'price', content: formatCurrency(product.price) },
        { key: 'categories', content: handleCategoriesColumn(product) },
        {
          key: 'isActive',
          type: 'custom',
          content: product.isActive ? (
            <Badge className="bg-success/10 text-success hover:bg-success/15">
              <span className="size-1.5 rounded-full bg-success" />
              Active
            </Badge>
          ) : (
            <Badge variant="destructive">
              <span className="size-1.5 rounded-full bg-destructive" />
              Inactive
            </Badge>
          ),
        },
        {
          key: 'actions',
          content: (
            <div className="flex justify-end gap-2">
              <ProductActions product={product} categories={categories} />
            </div>
          ),
        },
      ]}
    />
  );
}

function handleCategoriesColumn(product: Product) {
  const maxVisibleCategories = 2;
  const categories = product.categories!;
  const visibleCategories = categories.slice(0, maxVisibleCategories);
  const remaining = categories.length - visibleCategories.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleCategories!.map((category) => (
        <span
          key={category.id}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        >
          <span className="size-1.5 rounded-full bg-primary" />
          {category.name}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
          +{remaining} more
        </span>
      )}
    </div>
  );
}
