'use client';

import { Button } from '@/components/ui/button';
import * as config from '@/config/config';
import { Payment, PaymentStatus } from '@/domain';
import { getPaymentMethod, PaymentMethod, PaymentMidtrans } from '@/domain/payment.types';
import { getPaymentByOrderId, mockMidtransPaymentAction } from '@/features/payments/action';
import { useSSE } from '@/hooks/use-sse';
import { formatDateTime } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';
import moment from 'moment';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface PosPaymentModuleProps {
  orderId: number;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  payment: PaymentMidtrans;
  onPaid: (payment: Payment) => void;
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
  const [terminalStatus, setTerminalStatus] = useState<PaymentStatus | null>(null);
  const isCheckingPaymentStatus = useRef(false);
  const shouldRecheckPaymentStatus = useRef(false);
  const shouldNotifyPaymentStatusError = useRef(false);
  const isPaymentResolved = useRef(false);
  const lastReportedStatus = useRef<PaymentStatus | null>(null);
  const generation = useRef(0);

  useEffect(() => {
    // Abaikan respons yang kembali setelah order berganti atau dialog ditutup.
    generation.current += 1;
    isCheckingPaymentStatus.current = false;
    shouldRecheckPaymentStatus.current = false;
    shouldNotifyPaymentStatusError.current = false;
    isPaymentResolved.current = false;
    lastReportedStatus.current = null;
    return () => {
      generation.current += 1;
    };
  }, [orderId]);

  async function checkPaymentStatus(showLoading = false) {
    if (isPaymentResolved.current) return;

    if (showLoading) {
      setIsPaymentStatusLoading(true);
      shouldNotifyPaymentStatusError.current = true;
    }

    if (isCheckingPaymentStatus.current) {
      shouldRecheckPaymentStatus.current = true;
      return;
    }

    isCheckingPaymentStatus.current = true;
    const currentGeneration = generation.current;
    try {
      do {
        shouldRecheckPaymentStatus.current = false;
        const shouldNotifyError = shouldNotifyPaymentStatusError.current;
        shouldNotifyPaymentStatusError.current = false;
        const response = await getPaymentByOrderId<Payment>({ orderId }).catch(() => ({
          success: false as const,
          error: 'Failed to check payment status.',
          result: undefined,
        }));

        if (generation.current !== currentGeneration) return;
        if (shouldRecheckPaymentStatus.current) {
          // Event baru dapat membuat respons yang sedang diproses kedaluwarsa.
          shouldNotifyPaymentStatusError.current ||= shouldNotifyError;
          continue;
        }

        if (
          !response.success ||
          !response.result ||
          response.result.orderId !== orderId ||
          !Object.values(PaymentStatus).includes(response.result.status)
        ) {
          if (shouldNotifyError) {
            toast.error(response.error ?? 'Failed to check payment status.');
          }
          continue;
        }

        const confirmedPayment = response.result;
        if (confirmedPayment.status === PaymentStatus.PENDING) setTerminalStatus(null);
        if (confirmedPayment.status === PaymentStatus.SUCCESS) {
          isPaymentResolved.current = true;
          onPaid(confirmedPayment);
        } else if (confirmedPayment.status === PaymentStatus.EXPIRED) {
          isPaymentResolved.current = true;
          onExpired();
        } else if (
          confirmedPayment.status === PaymentStatus.CANCELLED ||
          confirmedPayment.status === PaymentStatus.FAILED
        ) {
          setTerminalStatus(confirmedPayment.status);
          if (lastReportedStatus.current !== confirmedPayment.status) {
            toast.error(
              confirmedPayment.status === PaymentStatus.CANCELLED
                ? 'Payment was cancelled.'
                : 'Payment failed.',
            );
          }
        }

        lastReportedStatus.current = confirmedPayment.status;
      } while (shouldRecheckPaymentStatus.current && !isPaymentResolved.current);
    } finally {
      if (generation.current === currentGeneration) {
        isCheckingPaymentStatus.current = false;
        setIsPaymentStatusLoading(false);
      }
    }
  }

  useSSE<{ id?: number; orderId?: number; orderNumber?: string }>({
    events: ['order.status'],
    onOpen: () => {
      void checkPaymentStatus();
    },
    onEvent: ({ data }) => {
      const isCurrentOrder =
        Array.isArray(data) &&
        data.some(
          (order) =>
            order?.id === orderId ||
            order?.orderId === orderId ||
            order?.orderNumber === orderNumber,
        );

      if (!isCurrentOrder) return;
      void checkPaymentStatus();
    },
  });

  function handleCopyVA() {
    if (payment.midtransDetail.vaNumber) {
      navigator.clipboard.writeText(payment.midtransDetail.vaNumber);
      toast.success('VA number copied!');
    }
  }

  if (terminalStatus === PaymentStatus.CANCELLED || terminalStatus === PaymentStatus.FAILED) {
    return (
      <div role="alert" className="space-y-3 rounded-lg border p-4">
        <p>
          {terminalStatus === PaymentStatus.CANCELLED
            ? 'Payment was cancelled.'
            : 'Payment failed.'}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isPaymentStatusLoading}
          onClick={() => void checkPaymentStatus(true)}
        >
          Check payment status
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PaymentCountdown
        expiryTime={payment.expiredAt}
        onExpiryReached={() => {
          void checkPaymentStatus();
        }}
      />

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
            <CheckPaymentStatusButton
              onPaymentStatusCheck={() => checkPaymentStatus(true)}
              isPaymentStatusLoading={isPaymentStatusLoading}
            />
            {!config.midtrans.isProduction && (
              <MockMidtransPaymentButton
                orderNumber={orderNumber}
                onPaymentStatusCheck={() => checkPaymentStatus(true)}
                paymentMethod={paymentMethod}
                grossAmount={payment.amount}
              />
            )}
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
              onPaymentStatusCheck={() => checkPaymentStatus(true)}
              isPaymentStatusLoading={isPaymentStatusLoading}
            />
            {!config.midtrans.isProduction && (
              <MockMidtransPaymentButton
                orderNumber={orderNumber}
                onPaymentStatusCheck={() => checkPaymentStatus(true)}
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
  onPaymentStatusCheck,
}: {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  grossAmount: number;
  onPaymentStatusCheck: () => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const onClick = async () => {
    setIsLoading(true);
    try {
      const result = await mockMidtransPaymentAction({ orderNumber, paymentMethod, grossAmount });

      if (!result.success) {
        toast.error(result.error ?? 'Failed to mock payment.');
        return;
      }

      await onPaymentStatusCheck();
    } finally {
      setIsLoading(false);
    }
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
  onExpiryReached,
}: {
  expiryTime: string | Date | null;
  onExpiryReached: () => void;
}) {
  const lastCheckedExpiry = useRef<number | null>(null);

  useEffect(() => {
    if (!expiryTime) return;

    const expiresAt = moment(expiryTime);
    if (!expiresAt.isValid()) return;

    const interval = setInterval(() => {
      if (!expiresAt.isSameOrBefore(new Date())) return;

      const expiryTimestamp = expiresAt.valueOf();
      if (lastCheckedExpiry.current === expiryTimestamp) return;

      lastCheckedExpiry.current = expiryTimestamp;
      onExpiryReached();
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime, onExpiryReached]);

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
  onPaymentStatusCheck,
  isPaymentStatusLoading,
}: {
  onPaymentStatusCheck: () => Promise<void>;
  isPaymentStatusLoading: boolean;
}) {
  return (
    <Button
      variant="outline"
      onClick={() => void onPaymentStatusCheck()}
      disabled={isPaymentStatusLoading}
    >
      {isPaymentStatusLoading ? <Loader2Icon className="animate-spin" /> : 'Check Payment Status'}
    </Button>
  );
}
