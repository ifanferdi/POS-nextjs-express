import { OrderDetailCard } from '@/app/(protected)/orders/_components/order-detail-card';
import { auth } from '@/auth';
import { Button } from '@/components/ui/button';
import { OrderDetail, OrderRelation } from '@/domain';
import { getOrderById } from '@/features/orders/api';
import { hasPermission, PERMISSION } from '@/lib/permission';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { forbidden, notFound } from 'next/navigation';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!hasPermission(session?.user.permissions, [PERMISSION.SHOW_ORDER])) forbidden();

  const { id } = await params;
  const order = await getOrderById<OrderDetail>(Number(id), [
    OrderRelation.ORDER_ITEMS_PRODUCT,
    OrderRelation.USER_PROFILE,
    OrderRelation.PAYMENT,
    OrderRelation.CUSTOMER_PROFILE,
  ]).catch(() => null);

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/orders" aria-label="Back to Orders">
            <ArrowLeftIcon />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Order Detail</h1>
      </div>

      <OrderDetailCard order={order} />
    </div>
  );
}
