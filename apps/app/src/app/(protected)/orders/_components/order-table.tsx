'use client';

import { OrderTable } from '@/app/(protected)/orders/_components/order-data-table';
import { OrderSearchParams } from '@/app/(protected)/orders/page';
import { TablePagination } from '@/components/shared/table';
import { ErrorTable } from '@/components/shared/table-server';
import { OrderList, OrderRelation, OrderStatus, PaymentMethod } from '@/domain';
import { getAllOrdersAction } from '@/features/orders/action';
import { GetAllOrderParams } from '@/features/orders/schema';
import { coerceEnum } from '@/lib/helper';
import { orderKeys } from '@/lib/tenstack-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { OrderTableSkeleton } from '../../orders/_components/order-table-skeleton';

export const headers = [
  '#',
  'Order #',
  // 'Customer',
  'Date',
  'Items',
  'Total',
  'Payment',
  'Status',
  '',
];
interface OrderTableSectionProps {
  searchParams: OrderSearchParams;
}
export function OrderTableSection(props: OrderTableSectionProps) {
  const { searchParams } = props;
  const { page, q, status, paymentMethod } = searchParams;

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

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: orderKeys.all(params),
    queryFn: () => getAllOrdersAction<OrderList>(params),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <OrderTableSkeleton />;
  if (isError) return <ErrorTable headers={headers} entities="orders" onRetry={() => refetch()} />;

  const { data: orders, ...meta } = data;

  return (
    <>
      <OrderTable orders={orders} />
      <TablePagination
        page={meta.page}
        totalPages={meta.totalPages}
        total={meta.total}
        baseUrl="/orders"
      />
    </>
  );
}
