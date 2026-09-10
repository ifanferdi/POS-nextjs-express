import { OrderActions } from '@/app/(protected)/orders/_components/order-actions';
import { TablePagination } from '@/components/shared/table';
import { DataTable, EmptyTable } from '@/components/shared/table-server';
import { Badge } from '@/components/ui/badge';
import { Order, OrderStatus } from '@/domain';
import { getAllOrders } from '@/features/orders/api';
import { GetAllOrderParams } from '@/features/orders/schema';
import { formatCurrency } from '@/lib/helper';
import moment from 'moment';

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
  params: GetAllOrderParams;
}
export async function OrderTableSection(props: OrderTableSectionProps) {
  const { params } = props;
  const { data: orders, ...meta } = await getAllOrders(params);
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

interface OrderTableProps {
  orders: Order[];
}
function OrderTable(props: OrderTableProps) {
  const { orders } = props;
  if (orders.length === 0) return <EmptyTable entities="orders" icon="order" />;

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <DataTable
        headers={headers}
        records={orders}
        cells={(order) => [
          {
            key: 'order-number',
            type: 'link',
            url: `/orders/${order.id}`,
            content: <span className="font-medium group-hover:underline">{order.orderNumber}</span>,
          },
          {
            key: 'date',
            content: moment(order.createdAt).format('MMM D, YYYY HH:mm'),
          },
          {
            key: 'items',
            content: `${order.orderItems?.length ?? 0} item`,
          },
          {
            key: 'total',
            content: formatCurrency(order.total),
          },
          {
            key: 'payment',
            type: 'custom',
            content: order.paymentMethod ? (
              <span className="inline-flex items-center gap-1.5 capitalize">
                {order.paymentMethod}
              </span>
            ) : (
              '-'
            ),
          },
          {
            key: 'status',
            type: 'custom',
            content: <OrderStatusBadge status={order.status} />,
          },
          {
            key: 'action',
            type: 'custom',
            content: (
              <div className="flex justify-end gap-2">
                <OrderActions order={order} />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-warning/10 text-warning',
  [OrderStatus.PAID]: 'bg-success/10 text-success',
  [OrderStatus.EXPIRED]: 'bg-destructive/10 text-destructive',
  [OrderStatus.COMPLETED]: 'bg-success/10 text-success',
  [OrderStatus.CANCELLED]: 'bg-destructive/10 text-destructive',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const className = ORDER_STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground';
  const dot =
    status === OrderStatus.PENDING
      ? 'bg-warning'
      : status === OrderStatus.COMPLETED
        ? 'bg-success'
        : 'bg-destructive';
  return (
    <Badge className={`${className} hover:${className}`}>
      <span className={`size-1.5 rounded-full ${dot}`} />
      <span className="capitalize">{status}</span>
    </Badge>
  );
}
