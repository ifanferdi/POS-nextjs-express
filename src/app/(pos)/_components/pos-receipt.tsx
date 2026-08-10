'use client';

import type { PosLastOrder } from '@/app/(pos)/_components/pos-view';
import { Button } from '@/components/ui/button';
import { PaymentMethod } from '@/domain';
import { formatCurrency } from '@/lib/helper';
import { PrinterIcon, RotateCcwIcon } from 'lucide-react';
import moment from 'moment';

interface PosReceiptProps {
  lastOrder: PosLastOrder;
  cashierName: string;
  onNewTransaction: () => void;
}

export function PosReceipt({ lastOrder, cashierName, onNewTransaction }: PosReceiptProps) {
  const { order, items, amountTendered } = lastOrder;
  const isCash = order.paymentMethod === PaymentMethod.CASH && amountTendered !== undefined;
  const change = isCash ? Math.max(0, amountTendered - order.total) : 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex gap-2 print:hidden">
        <Button onClick={() => window.print()} className="flex-1 gap-2">
          <PrinterIcon className="size-4" />
          Cetak Invoice
        </Button>
        <Button variant="outline" onClick={onNewTransaction} className="gap-2">
          <RotateCcwIcon className="size-4" />
          Transaksi Baru
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-border/60 bg-card print:overflow-visible print:border-0 print:p-0 print:shadow-none">
        <div className="space-y-4 p-6 text-sm print:p-2">
          <div className="text-center">
            <h1 className="text-base font-bold tracking-tight">STRUK PEMBAYARAN</h1>
            <p className="text-xs text-muted-foreground">{cashierName}</p>
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
            <ReceiptRow label="Subtotal" value={formatCurrency(order.subtotal)} />
            <ReceiptRow label="Pajak" value={formatCurrency(order.tax)} />
            {order.discount > 0 && (
              <ReceiptRow label="Diskon" value={`- ${formatCurrency(order.discount)}`} />
            )}
            <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-bold">
              <span>TOTAL</span>
              <span className="tabular-nums text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>

          {isCash && (
            <div className="space-y-1 text-xs">
              <ReceiptRow label="Tunai" value={formatCurrency(amountTendered)} />
              <ReceiptRow label="Kembalian" value={formatCurrency(change)} />
            </div>
          )}

          {order.notes && (
            <div className="border-t border-dashed border-border/60 pt-3 text-xs">
              <p className="font-medium">Catatan</p>
              <p className="mt-0.5 text-muted-foreground">{order.notes}</p>
            </div>
          )}

          <p className="pt-2 text-center text-xs text-muted-foreground">Terima Kasih!</p>
        </div>
      </div>
    </div>
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