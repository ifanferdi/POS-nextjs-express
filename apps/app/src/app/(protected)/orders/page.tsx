import { OrderFilter } from '@/app/(protected)/orders/_components/order-filter';
import { OrderSearch } from '@/app/(protected)/orders/_components/order-search';
import { OrderTableSection } from '@/app/(protected)/orders/_components/order-table';
import { OrderTableSkeleton } from '@/app/(protected)/orders/_components/order-table-skeleton';
import { auth } from '@/auth';
import { ParamsError } from '@/components/shared/error';
import { ErrorTable } from '@/components/shared/table-server';
import { OrderRelation } from '@/domain';
import { GetAllOrderSchema } from '@/features/orders/schema';
import { hasPermission, PERMISSION } from '@/lib/permission';
import { forbidden } from 'next/navigation';
import { Suspense } from 'react';
import { z } from 'zod';
import { headers } from './_components/order-data-table';

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    paymentMethod?: string;
  }>;
}

const OrderPageParamsSchema = GetAllOrderSchema.extend({ page: z.number().int().positive() });

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_ORDER])) forbidden();

  const { page, q, status, paymentMethod } = await searchParams;
  const result = OrderPageParamsSchema.safeParse({
    page: Number(page ?? 1),
    q,
    status,
    paymentMethod,
    with: [OrderRelation.PAYMENT],
  });

  return (
    <div className="space-y-6">
      {!result.success && <ParamsError errors={z.flattenError(result.error).fieldErrors} />}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your application orders</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <OrderSearch />
        <OrderFilter />
      </div>
      {result.success ? (
        <Suspense fallback={<OrderTableSkeleton />}>
          <OrderTableSection params={result.data} />
        </Suspense>
      ) : (
        <ErrorTable headers={headers} recoveryHref="/orders" />
      )}
    </div>
  );
}
