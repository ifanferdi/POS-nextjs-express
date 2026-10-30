'use client';

import { ProductActions } from '@/app/(protected)/products/_components/product-actions';
import { ProductTableSkeleton } from '@/app/(protected)/products/_components/product-table-skeleton';
import { ProductSearchParams } from '@/app/(protected)/products/page';
import { TablePagination } from '@/components/shared/table';
import { DataTable, EmptyTable, ErrorTable, TooltipedCell } from '@/components/shared/table-server';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CategoryOption, ProductList, ProductRelation } from '@/domain';
import { getAllProductsAction } from '@/features/products/action';
import { formatCurrency } from '@/lib/helper';
import { productKeys } from '@/lib/tenstack-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const headers = ['#', 'Name', 'Sku', 'Stock', 'Price', 'Categories', 'Is Active?', ''];

interface ProductTableSectionProps {
  searchParams: ProductSearchParams;
  categories: CategoryOption[];
  canManage: boolean;
}

export function ProductTableSection(props: ProductTableSectionProps) {
  const { searchParams, categories, canManage } = props;

  const { page, q, isActive, ...searchParam } = searchParams;
  const categoryIds =
    typeof searchParam['categoryId[]'] === 'string'
      ? [searchParam['categoryId[]']]
      : searchParam['categoryId[]'];

  const pageNum = Number(page ?? 1);
  const categoryIdsNum =
    categoryIds && categoryIds.length > 0 ? categoryIds.map((val) => Number(val)) : undefined;
  const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;

  const params = {
    page: pageNum,
    q,
    categoryId: categoryIdsNum,
    isActive: isActiveBool,
    with: [ProductRelation.CATEGORIES],
    orderBy: ['name:asc'],
  };

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: productKeys.all(params),
    queryFn: () => getAllProductsAction<ProductList>(params),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <ProductTableSkeleton />;
  if (isError)
    return <ErrorTable headers={headers} entities="products" onRetry={() => refetch()} />;

  const { data: products, ...meta } = data;

  return (
    <>
      <ProductTable products={products} categories={categories} canManage={canManage} />
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
  products: ProductList[];
  categories: CategoryOption[];
  canManage: boolean;
}
function ProductTable(props: ProductTableProps) {
  const { products, categories, canManage } = props;
  if (products.length === 0)
    return <EmptyTable entities="products" icon="product" headers={headers} />;

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
            <Badge className="bg-success/15 text-success hover:bg-success/30">
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
              <ProductActions product={product} categories={categories} canManage={canManage} />
            </div>
          ),
        },
      ]}
    />
  );
}

function handleCategoriesColumn(product: ProductList) {
  const categories = product.categories;
  const visibleCategories = categories.slice(0, 3);
  const hiddenCategories = categories.slice(3);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visibleCategories.map((category) => (
        <span
          key={category.id}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
        >
          <span className="size-1.5 rounded-full bg-primary" />
          {category.name}
        </span>
      ))}
      {hiddenCategories.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex h-5 items-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground cursor-help">
              +{hiddenCategories.length} more
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              {hiddenCategories.map((cat) => (
                <span key={cat.id} className="text-xs">
                  {cat.name}
                </span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
