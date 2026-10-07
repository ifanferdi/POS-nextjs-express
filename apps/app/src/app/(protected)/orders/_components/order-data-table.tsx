import { OrderActions } from '@/app/(protected)/orders/_components/order-actions';
import { CellsType, DataTable, EmptyTable } from '@/components/shared/table-server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getPaymentMethod, OrderList, OrderStatus, PaymentMethod, PaymentStatus } from '@/domain';
import { formatCurrency } from '@/lib/helper';
import { CreditCardIcon, EyeIcon, Loader2Icon } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';

export const orderTableHeaders = [
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

interface OrderTableProps {
  orders: OrderList[];
  /** When provided, the action column renders a view button instead of full order actions. */
  onView?: (order: OrderList) => void;
  /** When provided, a Pay button is shown for non-cash orders that are still pending. */
  onPay?: (order: OrderList) => void;
  isPayLoading?: boolean;
}

export function OrderTable({ orders, onView, onPay, isPayLoading }: OrderTableProps) {
  if (orders.length === 0) return <EmptyTable entities="orders" icon="order" />;

  const orderNumberCell = (order: OrderList): CellsType =>
    onView
      ? {
          key: 'order-number',
          type: 'custom',
          content: (
            <div className="flex">
              <Link
                href=""
                onClick={() => onView(order)}
                aria-label={`View order ${order.orderNumber}`}
              >
                <span className="font-medium group-hover:underline">{order.orderNumber}</span>
              </Link>
            </div>
          ),
        }
      : {
          key: 'order-number',
          type: 'link',
          url: `/orders/${order.id}`,
          content: <span className="font-medium group-hover:underline">{order.orderNumber}</span>,
        };

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      <DataTable
        headers={orderTableHeaders}
        records={orders}
        cells={(order) => [
          orderNumberCell(order),
          {
            key: 'date',
            content: moment(order.createdAt).format('MMM D, YYYY HH:mm'),
          },
          {
            key: 'items',
            content: `${order._count.orderItems ?? 0} item`,
          },
          {
            key: 'total',
            content: formatCurrency(order.total),
          },
          {
            key: 'payment',
            type: 'custom',
            content: order.payment?.method ? (
              <span className="inline-flex items-center gap-1.5 capitalize">
                {getPaymentMethod(order.payment.method)}
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
              <div className="flex justify-end gap-1">
                {onView && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`View order ${order.orderNumber}`}
                    title="View"
                    className="text-muted-foreground hover:bg-info/10 hover:text-info active:scale-90"
                    onClick={() => onView(order)}
                  >
                    <EyeIcon />
                  </Button>
                )}
                {onPay &&
                  order.payment?.method &&
                  order.payment.method !== PaymentMethod.CASH &&
                  order.payment.status === PaymentStatus.PENDING && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Pay order ${order.orderNumber}`}
                      title="Pay"
                      className="text-muted-foreground hover:bg-success/10 hover:text-success active:scale-90"
                      onClick={() => onPay(order)}
                      disabled={isPayLoading}
                    >
                      {isPayLoading ? <Loader2Icon className="animate-spin" /> : <CreditCardIcon />}
                    </Button>
                  )}
                {!onView && <OrderActions order={order} />}
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
