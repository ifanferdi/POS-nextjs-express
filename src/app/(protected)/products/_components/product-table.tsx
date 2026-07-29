import { ProductActions } from '@/app/(protected)/products/_components/product-actions';
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
import { BoxIcon } from 'lucide-react';
import Link from 'next/link';
import { ProductPagination } from './product-pagination';

interface ProductsTableSectionProps {
  params: GetAllProductParams;
  categories: CategoryOption[];
}
export async function ProductsTableSection({ params, categories }: ProductsTableSectionProps) {
  const { data: products, ...meta } = await getAllProducts(params);
  return (
    <>
      <ProductTable products={products} categories={categories} />
      <ProductPagination page={meta.page} total={meta.total} totalPages={meta.totalPages} />
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
          <BoxIcon className="size-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No products found</p>
        <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <Table>
        {ProductTableHeader}
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

export const ProductTableHeader = (
  <TableHeader>
    <TableRow className="bg-muted/40 hover:bg-muted/40">
      <TableHead className="text-xs text-muted-foreground">Name</TableHead>
      <TableHead className="text-xs text-muted-foreground">Sku</TableHead>
      <TableHead className="text-xs text-muted-foreground">Stock</TableHead>
      <TableHead className="text-xs text-muted-foreground">Price</TableHead>
      <TableHead className="text-xs text-muted-foreground">Categories</TableHead>
      <TableHead className="text-xs text-muted-foreground">Is Active?</TableHead>
      <TableHead className="text-right text-xs text-muted-foreground">Actions</TableHead>
    </TableRow>
  </TableHeader>
);
