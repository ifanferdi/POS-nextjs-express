import { OrderStatusBadge } from '@/app/(protected)/orders/_components/order-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Order, OrderRelation, PaymentStatus } from '@/domain';
import { getOrderById } from '@/features/orders/api';
import { formatCurrency, getInitials } from '@/lib/helper';
import { ArrowLeftIcon, CreditCardIcon, PackageIcon, ReceiptIcon, UserIcon } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { type ReactNode } from 'react';
import { OrderActions } from '@/app/(protected)/orders/_components/order-actions';

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-warning/10 text-warning',
  [PaymentStatus.COMPLETED]: 'bg-success/10 text-success',
  [PaymentStatus.FAILED]: 'bg-destructive/10 text-destructive',
  [PaymentStatus.REFUNDED]: 'bg-info/10 text-info',
};

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const className = PAYMENT_STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <span className="capitalize">{status}</span>
    </span>
  );
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById<Order>(Number(id), [
    OrderRelation.ORDER_ITEMS,
    OrderRelation.CUSTOMER,
    OrderRelation.USER,
    OrderRelation.PAYMENT,
  ]).catch(() => null);

  if (!order) notFound();

  const items = order.orderItems ?? [];
  const payment = order.payment;

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

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                <ReceiptIcon className="size-5 text-muted-foreground" />
                {order.orderNumber}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} />
                {order.paymentMethod && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    <CreditCardIcon className="size-3" />
                    <span className="capitalize">{order.paymentMethod}</span>
                  </span>
                )}
              </div>
            </div>
            <OrderActions order={order} />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Subtotal" value={formatCurrency(order.subtotal)} />
            <StatTile label="Tax" value={formatCurrency(order.tax)} />
            <StatTile label="Discount" value={`- ${formatCurrency(order.discount)}`} />
            <StatTile label="Total" value={formatCurrency(order.total)} emphasize />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <UserIcon className="size-4 text-muted-foreground" />
                Customer
              </h3>
              <Separator />
              {order.customer ? (
                <div className="flex items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {getInitials(order.customer.profile.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{order.customer.profile.fullName}</p>
                    <p className="text-xs text-muted-foreground">@{order.customer.username}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Walk-in customer</p>
              )}
              {order.user && (
                <p className="text-xs text-muted-foreground">
                  Served by <span className="font-medium">@{order.user.username}</span>
                </p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-medium">
                <CreditCardIcon className="size-4 text-muted-foreground" />
                Payment
              </h3>
              <Separator />
              {payment ? (
                <dl className="space-y-2 text-sm">
                  <Row label="Amount" value={formatCurrency(payment.amount)} />
                  <Row
                    label="Method"
                    value={<span className="capitalize">{payment.method}</span>}
                  />
                  <Row label="Status" value={<PaymentStatusBadge status={payment.status} />} />
                  {payment.reference && <Row label="Reference" value={payment.reference} />}
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No payment record.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <PackageIcon className="size-4 text-muted-foreground" />
              Order Items
            </h3>
            <Separator />
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items in this order.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs text-muted-foreground">Product</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Quantity</TableHead>
                      <TableHead className="text-xs text-muted-foreground">Unit Price</TableHead>
                      <TableHead className="text-xs text-muted-foreground text-right">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">
                          {item.product?.name ?? '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.quantity}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Notes</h3>
              <Separator />
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          <Separator />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Created at {moment(order.createdAt).format('MMMM D, YYYY, HH:mm')}</span>
            <span>Updated at {moment(order.updatedAt).format('MMMM D, YYYY, HH:mm')}</span>
            <span>
              Order ID: <span className="font-mono">{order.id}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${emphasize ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
