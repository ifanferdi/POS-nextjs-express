import { ProductActions } from '@/app/(protected)/products/_components/product-actions';
import { BarcodeDisplay } from '@/app/(protected)/products/_components/product-barcode';
import { auth } from '@/auth';
import { DiscountBadge } from '@/components/shared/discount';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProductDetail, ProductRelation } from '@/domain';
import { getProductById } from '@/features/products/api';
import { formatCurrency, formatDateTime, getActiveDiscount } from '@/lib/helper';
import { hasPermission, PERMISSION } from '@/lib/permission';
import { cn } from '@/lib/utils';
import {
  ArrowLeftIcon,
  BadgePercentIcon,
  BarcodeIcon,
  BoxIcon,
  ImageIcon,
  LayersIcon,
  PackageIcon,
  TagIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_PRODUCT])) forbidden();

  const canManage = hasPermission(session?.user.permissions, [PERMISSION.MANAGE_PRODUCT]);

  const { id } = await params;
  const product = await getProductById<ProductDetail>(Number(id), [
    ProductRelation.CATEGORIES,
    ProductRelation.DISCOUNT_CYCLES,
  ]);

  if (!product) notFound();

  const margin = product.cost ? product.price - product.cost : null;
  const lowStock = product.stock <= 5;
  const discount = getActiveDiscount(product.discount);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/products" aria-label="Back to Products">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Product Detail</h1>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl bg-muted">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    className="size-full object-cover"
                    width={200}
                    height={200}
                    loading="eager"
                  />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">{product.name}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {product.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                      <span className="size-1.5 rounded-full bg-success" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      <span className="size-1.5 rounded-full bg-destructive" />
                      Inactive
                    </span>
                  )}
                  {product.sku && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      <TagIcon className="size-3" />
                      {product.sku}
                    </span>
                  )}
                  {product.barcode && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      <BarcodeIcon className="size-3" />
                      {product.barcode}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ProductActions
              product={product}
              categories={product.categories!}
              canManage={canManage}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div
            className={cn('grid grid-cols-1 gap-4', discount ? 'sm:grid-cols-4' : 'sm:grid-cols-3')}
          >
            {discount && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Price
                </p>
                <p className="mt-1 text-2xl text-primary font-semibold tabular-nums">
                  {formatCurrency(discount.finalPrice)}
                </p>
              </div>
            )}
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {discount ? 'Normal Price' : 'Price'}
              </p>
              <p
                className={cn(
                  'mt-1 text-2xl text-muted-foreground tabular-nums',
                  !discount && 'text-primary font-semibold',
                )}
              >
                {formatCurrency(product.price)}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cost
              </p>
              <p className="mt-1 text-2xl text-muted-foreground tabular-nums">
                {product.cost != null ? formatCurrency(product.cost) : '-'}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Margin
              </p>
              <p className="mt-1 text-2xl text-muted-foreground tabular-nums">
                {margin != null ? formatCurrency(margin) : '-'}
              </p>
            </div>
          </div>

          {discount && (
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <BadgePercentIcon className="size-4 text-muted-foreground" />
                Discount
              </h3>
              <Separator />
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <dl className="grid flex-1 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Discount per unit</dt>
                      <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-muted-foreground tabular-nums">
                        -{formatCurrency(discount.amount)}
                        <DiscountBadge price={product.price} amount={discount.amount} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Final price</dt>
                      <dd className="mt-0.5 font-medium text-muted-foreground tabular-nums">
                        {formatCurrency(discount.finalPrice)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Period</dt>
                      <dd className="mt-0.5 text-muted-foreground tabular-nums">
                        {formatDateTime(discount.startDate)} - {formatDateTime(discount.endDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Quota</dt>
                      <dd className="mt-0.5 flex flex-wrap items-center gap-2 tabular-nums">
                        <span>
                          {discount.quota === null
                            ? 'Unlimited'
                            : `${discount.usedQty} of ${discount.quota} used`}
                        </span>
                        {discount.remainingQuota !== null && (
                          <span className="text-muted-foreground">
                            {discount.remainingQuota} left
                          </span>
                        )}
                        <DiscountStatusBadge remainingQuota={discount.remainingQuota} />
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <PackageIcon className="size-4 text-muted-foreground" />
                Description
              </h3>
              <Separator />
              <p className="text-sm text-muted-foreground">
                {product.description || 'No description provided.'}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <LayersIcon className="size-4 text-muted-foreground" />
                Inventory
              </h3>
              <Separator />
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Stock</dt>
                  <dd className="flex items-center gap-2 text-sm font-medium">
                    {product.stock} item
                    {lowStock && (
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                        Low
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">SKU</dt>
                  <dd className="text-sm font-medium">{product.sku || '-'}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <BarcodeIcon className="size-4 text-muted-foreground" />
              Barcode
            </h3>
            <Separator />
            <div className="flex flex-col items-center justify-center rounded-lg border border-border/60 bg-muted/30 px-2 py-6">
              <BarcodeDisplay value={product.barcode} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <BoxIcon className="size-4 text-muted-foreground" />
              Categories
            </h3>
            <Separator />
            {product.categories && product.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category) => (
                  <span
                    key={category.id}
                    className="inline-flex items-center rounded-full bg-gray-500/10 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No categories assigned.</p>
            )}
          </div>

          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Created at {formatDateTime(product.createdAt)}</span>
            <span>Updated at {formatDateTime(product.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DiscountStatusBadge({ remainingQuota }: { remainingQuota: number | null }) {
  const exhausted = remainingQuota === 0;
  const tone = exhausted ? 'bg-warning/10 text-warning' : 'bg-success/15 text-success';
  const dot = exhausted ? 'bg-warning' : 'bg-success';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        tone,
      )}
    >
      <span className={cn('size-1.5 rounded-full', dot)} />
      {exhausted ? 'Quota exhausted' : 'Active'}
    </span>
  );
}
