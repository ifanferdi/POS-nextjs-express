'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { company } from '@/config/config';
import { getPaymentMethod, PosLastOrder } from '@/domain';
import { PaymentMethod } from '@/domain/payment.types';
import { formatCurrency, formatDateTime, splitOrderItem } from '@/lib/helper';
import { PrinterIcon, RotateCcwIcon } from 'lucide-react';
import { useState } from 'react';

interface PosReceiptProps {
  lastOrder: PosLastOrder;
  onNewTransaction: () => void;
}

export function PosReceipt({ lastOrder, onNewTransaction }: PosReceiptProps) {
  const { orderItems: items, payment, user, ...order } = lastOrder;
  const [open, setOpen] = useState(!!lastOrder);
  const isCash = payment.method === PaymentMethod.CASH;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="md:max-w-md">
        <DialogHeader>
          <DialogTitle>Invoice: {order.orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-border/60 bg-card print:overflow-visible print:border-0 print:p-0 print:shadow-none">
          <div className="space-y-4 p-4 text-sm print:p-2">
            <div className="text-center">
              <p className="text-sm font-semi-bold pb-1">{company.name}</p>
              <p className="text-xs text-muted-foreground">{company.address}</p>
            </div>

            <div className="border-y border-dashed border-border/60 py-3 text-xs">
              <ReceiptRow label="No. Order" value={order.orderNumber} />
              <ReceiptRow label="Date" value={formatDateTime(order.createdAt)} />
              <ReceiptRow
                label="Payment"
                value={payment.method ? getPaymentMethod(payment.method) : '-'}
              />
              <ReceiptRow label="Cashier" value={order ? user.profile.fullName : '-'} />
            </div>

            <div className="space-y-1.5">
              {items.map((item) => {
                const split = splitOrderItem(item);
                const name = item.meta?.product?.name ?? item.product.name;

                return (
                  <div key={item.id} className="flex justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{name}</p>
                      {split.discountedQty > 0 && (
                        <p className="text-muted-foreground tabular-nums">
                          {split.discountedQty} x {formatCurrency(split.unitPrice)} discount
                        </p>
                      )}
                      {split.regularQty > 0 && (
                        <p className="text-muted-foreground tabular-nums">
                          {split.regularQty} x {formatCurrency(split.unitPrice)}
                          {split.discountedQty > 0 ? ' regular' : ''}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-medium text-muted-foreground tabular-nums">
                      {formatCurrency(split.total)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1 border-t border-dashed border-border/60 pt-3 text-xs">
              <div className="border-b border-border/60 pb-3">
                <ReceiptRow label="Subtotal" value={formatCurrency(order.subtotal)} />
                {order.totalDiscount > 0 && (
                  <ReceiptRow label="Discount" value={`-${formatCurrency(order.totalDiscount)}`} />
                )}
              </div>
              <div className="flex justify-between pt-2 text-sm font-bold">
                <span>TOTAL</span>
                <span className="text-muted-foreground tabular-nums">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>

            {isCash && (
              <div className="space-y-1 text-xs">
                <ReceiptRow label="Cash" value={formatCurrency(payment.amount ?? 0)} />
                <ReceiptRow label="Change" value={formatCurrency(payment.change ?? 0)} />
              </div>
            )}

            {order.notes && (
              <div className="border-t border-dashed border-border/60 pt-3 text-xs">
                <p className="font-medium">Notes</p>
                <p className="mt-0.5 text-muted-foreground">{order.notes}</p>
              </div>
            )}

            <p className="pt-3 border-t border-border/60 text-center text-xs text-muted-foreground">
              Thank you!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => window.print()} className="flex-1 gap-2">
            <PrinterIcon className="size-4" />
            Print Invoice
          </Button>
          <Button
            variant="outline"
            onClick={() => (setOpen(false), onNewTransaction)}
            className="gap-2"
          >
            <RotateCcwIcon className="size-4" />
            New Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-muted-foreground tabular-nums">{value}</span>
    </div>
  );
}
