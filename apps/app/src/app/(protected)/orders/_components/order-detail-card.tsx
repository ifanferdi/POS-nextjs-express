import { OrderActions } from '@/app/(protected)/orders/_components/order-actions';
import { OrderStatusBadge } from '@/app/(protected)/orders/_components/order-data-table';
import { DiscountBadge } from '@/components/shared/discount';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { getPaymentMethod, OrderDetail, PaymentStatus } from '@/domain';
import { formatCurrency, formatDateTime, getInitials, splitOrderItem } from '@/lib/helper';
import { CreditCardIcon, PackageIcon, PercentIcon, ReceiptIcon, UserIcon } from 'lucide-react';
import { ReactNode } from 'react';

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-warning/10 text-warning',
  [PaymentStatus.SUCCESS]: 'bg-success/15 text-success',
  [PaymentStatus.FAILED]: 'bg-destructive/10 text-destructive',
  [PaymentStatus.EXPIRED]: 'bg-destructive/10 text-destructive',
  [PaymentStatus.CANCELLED]: 'bg-info/10 text-info',
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

interface OrderDetailCardProps {
  order: OrderDetail;
  /** Optional actions rendered in the card header. Defaults to full order actions. */
  headerActions?: ReactNode;
}

export function OrderDetailCard({ order, headerActions }: OrderDetailCardProps) {
  const items = order.orderItems ?? [];
  const payment = order.payment;
  const discounts = order.meta?.discounts ?? [];
  const products = order.meta?.products ?? [];

  return (
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
              {order.payment.method && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  <CreditCardIcon className="size-3" />
                  <span className="capitalize">{getPaymentMethod(order.payment.method)}</span>
                </span>
              )}
            </div>
          </div>
          {headerActions !== undefined ? headerActions : <OrderActions order={order} />}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Subtotal" value={formatCurrency(order.subtotal)} />
          <StatTile
            label="Discount"
            value={order.totalDiscount > 0 ? `-${formatCurrency(order.totalDiscount)}` : '-'}
          />
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
                <Row
                  label="Amount"
                  value={
                    <span className="text-muted-foreground tabular-nums">
                      {formatCurrency(payment.amount)}
                    </span>
                  }
                />
                <Row
                  label="Method"
                  value={<span className="capitalize">{getPaymentMethod(payment.method)}</span>}
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
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs text-muted-foreground">Product</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Quantity</TableHead>
                    <TableHead className="text-xs text-muted-foreground">Unit Price</TableHead>
                    <TableHead className="text-xs text-muted-foreground text-right">
                      Discount
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground text-right">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.flatMap((item) => {
                    const split = splitOrderItem(item);
                    const name = item.meta?.product?.name ?? item.product?.name ?? '-';
                    const rows: ReactNode[] = [];

                    if (split.discountedQty > 0) {
                      rows.push(
                        <TableRow key={`${item.id}-discount`}>
                          <TableCell className="font-mono text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate">{name}</span>
                              <DiscountBadge
                                price={split.unitPrice}
                                amount={split.discountAmount / split.discountedQty}
                              />
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {split.discountedQty}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {formatCurrency(split.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground tabular-nums">
                            -{formatCurrency(split.discountAmount)}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(
                              split.discountedQty * split.unitPrice - split.discountAmount,
                            )}
                          </TableCell>
                        </TableRow>,
                      );
                    }

                    if (split.regularQty > 0) {
                      rows.push(
                        <TableRow key={`${item.id}-regular`}>
                          <TableCell className="font-mono text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate">{name}</span>
                              {split.discountedQty > 0 && (
                                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  Regular
                                </span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {split.regularQty}
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {formatCurrency(split.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">-</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatCurrency(split.regularQty * split.unitPrice)}
                          </TableCell>
                        </TableRow>,
                      );
                    }

                    return rows;
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {discounts.length > 0 && (
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <PercentIcon className="size-4 text-muted-foreground" />
              Applied promotions
            </h3>
            <Separator />
            <ul className="space-y-2">
              {discounts.map((discount) => {
                const product = products.find((p) => p.id === discount.productId);

                return (
                  <li
                    key={discount.id}
                    className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">
                        {product?.name ?? `Product ${discount.productId}`}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground tabular-nums">
                        -{formatCurrency(discount.amount)} per unit
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(discount.startDate)} - {formatDateTime(discount.endDate)}
                      {discount.quota !== null && ` · quota ${discount.quota}`}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {order.notes && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Notes</h3>
            <Separator />
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}

        <Separator />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Created at {formatDateTime(order.createdAt)}</span>
          <span>Cashier: {`${order.user.profile.fullName} (${order.user.username})`}</span>
          <span>Updated at {formatDateTime(order.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
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
      <p
        className={`mt-1 text-xl text-muted-foreground tabular-nums ${
          emphasize ? 'font-bold' : 'font-semibold'
        }`}
      >
        {value}
      </p>
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
