import { OrderFilter } from '@/app/(protected)/orders/_components/order-filter';
import { OrderSearch } from '@/app/(protected)/orders/_components/order-search';
import { OrderTableSection } from '@/app/(protected)/orders/_components/order-table';
import { auth } from '@/auth';
import { hasPermission, PERMISSION } from '@/lib/permission';
import { forbidden } from 'next/navigation';

export interface OrderSearchParams {
  page?: string;
  q?: string;
  status?: string;
  paymentMethod?: string;
}

interface OrdersPageProps {
  searchParams: Promise<OrderSearchParams>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_ORDER])) forbidden();

  return (
    <div className="space-y-6">
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
      <OrderTableSection searchParams={await searchParams} />
    </div>
  );
}
