import { EmptyTable, TablePagination } from '@/components/shared/table';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Order, OrderStatus } from '@/domain';
import { getAllOrders } from '@/features/orders/api';
import { GetAllOrderParams } from '@/features/orders/schema';
import { formatCurrency } from '@/lib/helper';
import moment from 'moment';
import Link from 'next/link';
import { OrderActions } from './order-actions';

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
      <Table>
        <OrderTableHeader />
        <TableBody>
          {orders.map((order, index) => (
            <TableRow key={order.id} className="group">
              <TableCell className="text-muted-foreground text-center">{index + 1}</TableCell>
              <TableCell>
                <Link href={`/orders/${order.id}`} className="flex items-center gap-3">
                  <span className="font-medium group-hover:underline">{order.orderNumber}</span>
                </Link>
              </TableCell>
              {/* <TableCell className="text-muted-foreground">
                {order.customer?.profile.fullName ?? 'Walk-in Customer'}
              </TableCell> */}
              <TableCell className="text-muted-foreground">
                {moment(order.createdAt).format('MMM D, YYYY HH:mm')}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {order.orderItems?.length ?? 0} item
              </TableCell>
              <TableCell className="text-muted-foreground">{formatCurrency(order.total)}</TableCell>
              <TableCell className="text-muted-foreground">
                {order.paymentMethod ? (
                  <span className="inline-flex items-center gap-1.5 capitalize">
                    {order.paymentMethod}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="w-0">
                <div className="flex justify-end gap-2">
                  <OrderActions order={order} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-warning/10 text-warning',
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

export function OrderTableHeader() {
  const HEADERS = [
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
  return (
    <TableHeader>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        {HEADERS.map((header) => (
          <TableHead
            key={header}
            className={`text-xs text-muted-foreground ${header === '#' ? 'w-0 px-3 text-center' : ''}`}
          >
            {header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}
