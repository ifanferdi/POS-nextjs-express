import { ProductActions } from '@/app/(protected)/products/_components/product-actions';
import { EmptyTable, TablePagination } from '@/components/shared/table';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CategoryOption, Product } from '@/domain';
import { getAllProducts } from '@/features/products/api';
import { GetAllProductParams } from '@/features/products/schema';
import { formatCurrency } from '@/lib/helper';
import Link from 'next/link';

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
    <div className="overflow-hidden rounded-lg border border-border/60">
      <Table>
        <ProductTableHeader />
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="group">
              <TableCell>
                <Link href={`/products/${product.id}`} className="flex items-center gap-3">
                  <span className="font-medium group-hover:underline">{product.name}</span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.sku === '' ? '-' : product.sku}
              </TableCell>
              <TableCell className="text-muted-foreground">{product.stock} item</TableCell>
              <TableCell className="text-muted-foreground">
                {formatCurrency(product.price)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {handleCategoriesColumn(product)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.isActive ? (
                  <Badge className="bg-success/10 text-success hover:bg-success/15">
                    <span className="size-1.5 rounded-full bg-success" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <span className="size-1.5 rounded-full bg-destructive" />
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <ProductActions product={product} categories={categories} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
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

export function ProductTableHeader() {
  const HEADERS = ['Name', 'Sku', 'Stock', 'Price', 'Categories', 'Is Active?', 'Actions'];
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        {HEADERS.map((header) => (
          <TableHead
            key={header}
            className={`text-xs text-muted-foreground ${header === 'Actions' ? 'text-right w-0' : ''}`}
          >
            {header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
