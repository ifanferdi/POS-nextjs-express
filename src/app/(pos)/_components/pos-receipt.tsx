'use client';

import type { PosLastOrder } from '@/app/(pos)/_components/pos-view';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { company } from '@/config/config';
import { PaymentMethod } from '@/domain';
import { formatCurrency } from '@/lib/helper';
import { PrinterIcon, RotateCcwIcon } from 'lucide-react';
import moment from 'moment';
import { useState } from 'react';

interface PosReceiptProps {
  lastOrder: PosLastOrder;
  onNewTransaction: () => void;
}

export function PosReceipt({ lastOrder, onNewTransaction }: PosReceiptProps) {
  const { order, items, amountTendered } = lastOrder;
  const [open, setOpen] = useState(!!lastOrder);
  const isCash = order.paymentMethod === PaymentMethod.CASH && amountTendered !== undefined;

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
              <ReceiptRow
                label="Waktu"
                value={moment(order.createdAt).format('DD MMM YYYY, HH:mm')}
              />
              <ReceiptRow
                label="Pembayaran"
                value={order.paymentMethod ? capitalize(order.paymentMethod) : '-'}
              />
            </div>

            <div className="space-y-1.5">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-muted-foreground">
                      {item.quantity} x {formatCurrency(item.price)}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium tabular-nums">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 border-t border-dashed border-border/60 pt-3 text-xs">
              <div className="border-b border-border/60 pb-3">
                <ReceiptRow label="Subtotal" value={formatCurrency(order.subtotal)} />
                <ReceiptRow label="Pajak" value={formatCurrency(order.tax)} />
                {order.discount > 0 && (
                  <ReceiptRow label="Diskon" value={`- ${formatCurrency(order.discount)}`} />
                )}
              </div>
              <div className="flex justify-between pt-2 text-sm font-bold">
                <span>TOTAL</span>
                <span className="tabular-nums text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {isCash && (
              <div className="space-y-1 text-xs">
                <ReceiptRow label="Tunai" value={formatCurrency(order.payment?.amount ?? 0)} />
                <ReceiptRow label="Kembalian" value={formatCurrency(order.payment?.change ?? 0)} />
              </div>
            )}

            {order.notes && (
              <div className="border-t border-dashed border-border/60 pt-3 text-xs">
                <p className="font-medium">Catatan</p>
                <p className="mt-0.5 text-muted-foreground">{order.notes}</p>
              </div>
            )}

            <p className="pt-3 border-t border-border/60 text-center text-xs text-muted-foreground">
              Terima Kasih!
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => window.print()} className="flex-1 gap-2">
            <PrinterIcon className="size-4" />
            Cetak Invoice
          </Button>
          <Button
            variant="outline"
            onClick={() => (setOpen(false), onNewTransaction)}
            className="gap-2"
          >
            <RotateCcwIcon className="size-4" />
            Transaksi Baru
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
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
