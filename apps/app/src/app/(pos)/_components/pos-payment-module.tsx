'use client';

import { Button } from '@/components/ui/button';
import { app } from '@/config/config';
import { CreatedOrder, Payment, PaymentStatus } from '@/domain';
import { getPaymentMethod, PaymentMethod, PaymentMidtrans } from '@/domain/payment.types';
import { getPaymentByOrderId, mockMidtransPaymentAction } from '@/features/payments/action';
import { useSSE } from '@/hooks/use-sse';
import { formatDateTime } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';
import moment from 'moment';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PosPaymentModuleProps {
  orderId: number;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  payment: PaymentMidtrans;
  onPaid: () => void;
  onExpired: () => void;
}

export function PosPaymentModule({
  orderId,
  orderNumber,
  paymentMethod,
  payment,
  onPaid,
  onExpired,
}: PosPaymentModuleProps) {
  const [isPaymentStatusLoading, setIsPaymentStatusLoading] = useState(false);

  useSSE<CreatedOrder>({
    events: ['order.status'],
    onEvent: ({ data }) => {
      const paidOrder = data[0];
      if (paidOrder?.orderNumber !== orderNumber) return;
      onPaid();
    },
  });

  function handleCopyVA() {
    if (payment.midtransDetail.vaNumber) {
      navigator.clipboard.writeText(payment.midtransDetail.vaNumber);
      toast.success('VA number copied!');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PaymentCountdown expiryTime={payment.expiredAt} onExpired={onExpired} />

      <div className="flex flex-1 items-center justify-center rounded-lg border-2 bg-muted/20 p-8">
        {payment.midtransDetail.paymentType === 'qris' && payment.midtransDetail.qrCodeUrl ? (
          <div className="flex flex-col items-center gap-6">
            <div className="space-y-1 text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Scan to Pay
              </p>
              <p className="text-2xl font-bold">QRIS</p>
            </div>
            <div className="rounded-lg border-2 bg-white p-4 shadow-sm">
              <Image
                width={200}
                height={200}
                src={payment.midtransDetail.qrCodeUrl}
                alt="QRIS QR Code"
                className="size-64"
              />
            </div>
            <p className="max-w-xs text-center text-xs text-muted-foreground">
              Open your e-wallet app and scan this code to complete payment
            </p>
          </div>
        ) : payment.midtransDetail.vaNumber ? (
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <div className="space-y-1 text-center">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Transfer to
              </p>
              <p className="text-2xl font-bold">{vaBankLabel(paymentMethod)}</p>
            </div>
            <div className="w-full space-y-4 rounded-lg border-2 bg-card p-6 shadow-sm">
              <div className="text-center">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Virtual Account Number
                </p>
                <button
                  type="button"
                  onClick={handleCopyVA}
                  className={cn(
                    'w-full text-center font-mono font-bold tabular-nums tracking-wider transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    vaNumberSizeClass(payment.midtransDetail.vaNumber),
                  )}
                  aria-label="Copy virtual account number"
                >
                  {payment.midtransDetail.vaNumber}
                </button>
                <p className="mt-2 text-xs text-muted-foreground">Click account number to copy</p>
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Use mobile banking or ATM to transfer to this account number
            </p>
            <CheckPaymentStatusButton
              orderId={orderId}
              onPaid={onPaid}
              isPaymentStatusLoading={isPaymentStatusLoading}
              setIsPaymentStatusLoading={setIsPaymentStatusLoading}
            />
            {app.env !== 'production' && (
              <MockMidtransPaymentButton
                orderNumber={orderNumber}
                onPaid={onPaid}
                paymentMethod={paymentMethod}
                grossAmount={payment.amount}
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MockMidtransPaymentButton({
  orderNumber,
  paymentMethod,
  grossAmount,
  onPaid,
}: {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  grossAmount: number;
  onPaid: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    setIsLoading(true);
    const result = await mockMidtransPaymentAction({ orderNumber, paymentMethod, grossAmount });
    setIsLoading(false);

    if (!result.success) {
      toast.error(result.error ?? 'Failed to mock payment.');
      return;
    }

    onPaid();
  };

  return (
    <Button variant="secondary" onClick={onClick} disabled={isLoading}>
      {isLoading ? <Loader2Icon className="animate-spin" /> : 'Mock Midtrans Payment'}
    </Button>
  );
}

function vaBankLabel(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.VA_BCA:
      return 'BCA';
    case PaymentMethod.VA_BNI:
      return 'BNI';
    case PaymentMethod.VA_BRI:
      return 'BRI';
    case PaymentMethod.VA_MANDIRI:
      return 'Mandiri';
    default:
      return getPaymentMethod(method);
  }
}

function vaNumberSizeClass(vaNumber: string): string {
  if (vaNumber.length > 20) return 'text-base sm:text-lg';
  if (vaNumber.length > 14) return 'text-lg sm:text-xl';
  return 'text-xl sm:text-2xl';
}

function PaymentCountdown({
  expiryTime,
  onExpired,
}: {
  expiryTime: string | Date | null;
  onExpired: () => void;
}) {
  useEffect(() => {
    const interval = setInterval(() => {
      if (!expiryTime) onExpired();

      const isExpired = moment(expiryTime).isSameOrBefore(new Date());

      if (isExpired) onExpired();
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime, onExpired]);

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-muted-foreground">
        Payment will expired at:{' '}
        <span className="font-bold">
          {expiryTime
            ? formatDateTime(new Date(expiryTime))
            : formatDateTime(moment().add(1, 'hours').toDate())}
        </span>
      </div>
    </div>
  );
}

function CheckPaymentStatusButton({
  orderId,
  onPaid,
  isPaymentStatusLoading,
  setIsPaymentStatusLoading,
}: {
  orderId: number;
  onPaid: () => void;
  isPaymentStatusLoading: boolean;
  setIsPaymentStatusLoading: (bool: boolean) => void;
}) {
  const onClick = async () => {
    setIsPaymentStatusLoading(true);
    const payment = await getPaymentByOrderId<Pick<Payment, 'status'>>({
      orderId,
      columns: ['status'],
    });

    if (payment.status === PaymentStatus.SUCCESS) {
      toast.success('Payment received!');
      onPaid();
    }

    setIsPaymentStatusLoading(false);
  };

  return (
    <Button variant="outline" onClick={onClick}>
      {isPaymentStatusLoading ? <Loader2Icon className="animate-spin" /> : 'Check Payment Status'}
    </Button>
  );
}
