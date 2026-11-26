'use client';

import { QueryError } from '@/components/shared/query-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboard as dashboardConfig } from '@/config/config';
import { DashboardTopProduct } from '@/domain';
import { getDashboardTopProductsAction } from '@/features/dashboard/action';
import { formatCurrency } from '@/lib/helper';
import { dashboardKeys } from '@/lib/tenstack-keys';
import { useQuery } from '@tanstack/react-query';

const TZ = dashboardConfig.timezone;
const TOP_PRODUCTS_LIMIT = 10;

interface DashboardTopProductsProps {
  range: { from: string; to: string };
}

export function DashboardTopProducts({ range }: DashboardTopProductsProps) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: dashboardKeys.topProduct(range),
    queryFn: () => getDashboardTopProductsAction({ ...range, tz: TZ, limit: TOP_PRODUCTS_LIMIT }),
  });

  const products = (data ?? []) as DashboardTopProduct[];
  const totalRevenue = products.reduce((sum, product) => sum + product.revenue, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
        <CardDescription>Best sellers in this period</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center">
        {isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No products sold in this period.
          </div>
        ) : (
          // Struk belanja: garis putus-putus + angka monospace + total di bawah
          <div className="font-mono text-sm">
            <ul>
              {products.map((product, index) => (
                <li
                  key={product.productId}
                  className="flex items-baseline gap-2 border-b border-dashed border-border py-2"
                >
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate ${product.name ? '' : 'italic text-muted-foreground'}`}
                  >
                    {product.name ?? 'Produk terhapus'}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {product.quantity}×
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatCurrency(product.revenue, 0)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline gap-2 pt-3 font-semibold">
              <span className="text-xs text-muted-foreground">TOTAL</span>
              <span className="flex-1" />
              <span className="tabular-nums">{formatCurrency(totalRevenue, 0)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
