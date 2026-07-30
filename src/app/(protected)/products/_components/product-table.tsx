import { ProductActions } from '@/app/(protected)/products/_components/product-actions';
import { TablePagination } from '@/components/shared/table';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { icons } from '@/config/config';
import { CategoryOption, Product } from '@/domain';
import { getAllProducts } from '@/features/products/api';
import { GetAllProductParams } from '@/features/products/schema';
import Link from 'next/link';

interface ProductsTableSectionProps {
  params: GetAllProductParams;
  categories: CategoryOption[];
}
export async function ProductsTableSection({ params, categories }: ProductsTableSectionProps) {
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
function ProductTable({ products, categories }: ProductTableProps) {
  if (products.length === 0)
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <icons.product className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No products found</p>
        <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
      </div>
    );

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
              <TableCell className="text-muted-foreground">{product.price}</TableCell>
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
            className={`text-xs text-muted-foreground ${header === 'Actions' ? 'text-right' : ''}`}
          >
            {header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
