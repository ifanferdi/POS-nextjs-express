import { OrderFilter } from '@/app/(protected)/orders/_components/order-filter';
import { OrderSearch } from '@/app/(protected)/orders/_components/order-search';
import { OrderTableSection } from '@/app/(protected)/orders/_components/order-table';
import { OrderTableSkeleton } from '@/app/(protected)/orders/_components/order-table-skeleton';
import { auth } from '@/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderRelation, OrderStatus, PaymentMethod } from '@/domain';
import { GetAllOrderParams } from '@/features/orders/schema';
import { hasPermission, PERMISSION } from '@/lib/permission';
import { forbidden } from 'next/navigation';
import { Suspense } from 'react';

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
    paymentMethod?: string;
  }>;
}

function coerceEnum<T extends string>(
  value: string | undefined,
  values: readonly T[],
): T | undefined {
  return value && (values as readonly string[]).includes(value) ? (value as T) : undefined;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_ORDER])) forbidden();

  const { page, q, status, paymentMethod } = await searchParams;
  const pageNum = Number(page ?? 1);
  const statusEnum = coerceEnum(status, Object.values(OrderStatus));
  const paymentMethodEnum = coerceEnum(paymentMethod, Object.values(PaymentMethod));

  const params: GetAllOrderParams = {
    page: pageNum,
    q,
    status: statusEnum,
    paymentMethod: paymentMethodEnum,
    with: [OrderRelation.PAYMENT],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your application orders</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={<Skeleton className="h-9 w-full sm:w-72" />}>
          <OrderSearch />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-9 w-24" />}>
          <OrderFilter />
        </Suspense>
      </div>
      <Suspense fallback={<OrderTableSkeleton />}>
        <OrderTableSection params={params} />
      </Suspense>
    </div>
  );
}
