import { CreateDiscountCycleButton } from '@/app/(protected)/product-discount-cycles/_components/create-discount-cycle-button';
import { DiscountCycleFilter } from '@/app/(protected)/product-discount-cycles/_components/discount-cycle-filter';
import { DiscountCycleSearch } from '@/app/(protected)/product-discount-cycles/_components/discount-cycle-search';
import {
  discountCycleHeaders,
  DiscountCycleTableSection,
} from '@/app/(protected)/product-discount-cycles/_components/discount-cycle-table';
import { DiscountCycleTableSkeleton } from '@/app/(protected)/product-discount-cycles/_components/discount-cycle-table-skeleton';
import { auth } from '@/auth';
import { ParamsError } from '@/components/shared/error';
import { ErrorTable } from '@/components/shared/table-server';
import { ProductDiscountCycleRelation } from '@/domain';
import { GetAllProductDiscountCycleSchema } from '@/features/product-discount-cycles/schema';
import { getAllProducts } from '@/features/products/api';
import { hasPermission, PERMISSION } from '@/lib/permission';
import moment from 'moment';
import { forbidden } from 'next/navigation';
import { Suspense } from 'react';
import { z } from 'zod';
import type { DiscountProductOption } from './_components/discount-cycle-form-dialog';

interface ProductDiscountCyclesPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    productId?: string;
    from?: string;
    to?: string;
  }>;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` query value to ISO-8601; null marks a provided invalid date. */
function toIsoDate(value: string | undefined, edge: 'start' | 'end') {
  if (!value || !DATE_PATTERN.test(value)) return undefined;

  const date = moment(value);
  if (!date.isValid()) return undefined;

  return (edge === 'start' ? date.startOf('day') : date.endOf('day')).toISOString();
}

export default async function ProductDiscountCyclesPage(props: ProductDiscountCyclesPageProps) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_PRODUCT_DISCOUNT_CYCLE]))
    forbidden();

  const canManage = hasPermission(session?.user.permissions, [
    PERMISSION.MANAGE_PRODUCT_DISCOUNT_CYCLE,
  ]);

  const { page, q, productId, from, to } = await props.searchParams;
  const productIdNum = productId && Number(productId) > 0 ? Number(productId) : undefined;

  const validated = GetAllProductDiscountCycleSchema.safeParse({
    page: Number(page ?? 1),
    q,
    productId: productIdNum,
    from: toIsoDate(from, 'start'),
    to: toIsoDate(to, 'end'),
    with: [ProductDiscountCycleRelation.PRODUCT],
    orderBy: ['startDate:desc'],
  });

  const { data: products } = await getAllProducts<DiscountProductOption>({
    limit: -1,
    columns: ['id', 'name', 'price'],
    orderBy: ['updatedAt:asc'],
  });

  return (
    <div className="space-y-6">
      {!validated.success && <ParamsError errors={z.flattenError(validated.error).fieldErrors} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Product discounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule discount cycles per product and track the remaining quota.
          </p>
        </div>
        {canManage && <CreateDiscountCycleButton products={products} />}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <DiscountCycleSearch />
        <DiscountCycleFilter from={from} to={to} />
      </div>

      {validated.success ? (
        <Suspense fallback={<DiscountCycleTableSkeleton />}>
          <DiscountCycleTableSection
            params={validated.data}
            products={products}
            canManage={canManage}
          />
        </Suspense>
      ) : (
        <ErrorTable headers={discountCycleHeaders} recoveryHref="/product-discount-cycles" />
      )}
    </div>
  );
}
