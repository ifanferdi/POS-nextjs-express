'use client';

import { PosLastOrder } from '@/app/(pos)/_components/pos-view';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Order } from '@/domain';
import { MidtransPaymentDetail, PaymentMethod } from '@/domain/payment.types';
import { createOrderAction } from '@/features/orders/action';
import { PosCheckoutForm, PosCheckoutFormSchema } from '@/features/orders/schema';
import { CartItem, useCartStore } from '@/hooks/pos-cart-store';
import { useSSE } from '@/hooks/use-sse';
import { calculateRounding, formatCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import moment from 'moment';
import Image from 'next/image';
import { useEffect, useState, useTransition } from 'react';
import { Controller, useForm, UseFormReturn, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

function OrderItems({ items }: { items: CartItem[] }) {
  return (
    <div className="max-h-40 divide-y border-y-2 overflow-y-auto">
      {items.map((item) => (
        <div key={item.productId} className="flex items-center gap-2 py-2 text-xs">
          <span className="shrink-0 font-bold tabular-nums text-muted-foreground">
            {item.quantity}×
          </span>
          <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
          <span className="shrink-0 font-mono tabular-nums">
            {formatCurrency(item.price * item.quantity)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PaymentCountdown({
  order,
  expiryTime,
  setCheckoutOpen,
  form,
  onCheckoutSuccess,
  setPendingPayment,
}: {
  order: Order & { snapshot: CartItem[] };
  expiryTime: Date | string;
  setCheckoutOpen: (open: boolean) => void;
  form: UseFormReturn<PosCheckoutForm>;
  onCheckoutSuccess: (result: PosLastOrder) => void;
  setPendingPayment: (
    result: (MidtransPaymentDetail & { snapshot: CartItem[] }) | undefined,
  ) => void;
}) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    // const expiry = order.payment?.midtransDetail?.expiryTime
    //   ? new Date(order.payment?.midtransDetail?.expiryTime).getTime()
    //   : moment().add(1, 'hours').toDate().getTime();
    const expiry = moment().add(10, 'seconds').toDate().getTime();
    const start = Date.now();
    const totalDuration = expiry - start;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        toast.error('Payment expired!');
        clearInterval(interval);
        useCartStore.getState().clear();
        onCheckoutSuccess({
          order: order,
          items: order.snapshot,
        });
        setPendingPayment(undefined);
        form.reset();
        setTimeLeft('Expired');
        setProgress(0);
        setCheckoutOpen(false);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        setProgress(Math.max(0, (diff / totalDuration) * 100));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime, form, setCheckoutOpen, onCheckoutSuccess, order, setPendingPayment]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <div className="relative inline-flex items-center justify-center">
        <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-border/40"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-[#FF9500] transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-lg font-bold tabular-nums">{timeLeft}</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">Payment window closes when timer expires</div>
    </div>
  );
}

interface PosCheckoutDialogProps {
  open: boolean;
  setCheckoutOpen: (open: boolean) => void;
  subtotal: number;
  onCheckoutSuccess: (result: PosLastOrder) => void;
}
export function PosCheckoutDialog({
  open,
  setCheckoutOpen,
  subtotal,
  onCheckoutSuccess,
}: PosCheckoutDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingPayment, setPendingPayment] = useState<
    MidtransPaymentDetail & { snapshot: CartItem[] }
  >();
  const [copied, setCopied] = useState(false);
  const { rounding, total } = calculateRounding(subtotal);
  const [createdOrder, setCreatedOrder] = useState<Order>();

  const form = useForm<PosCheckoutForm>({
    resolver: zodResolver(PosCheckoutFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      subtotal: total,
      paymentMethod: PaymentMethod.CASH,
      notes: '',
      amountTendered: 0,
    },
  });

  useSSE<Order>({
    events: ['order.status'],
    onEvent: ({ data }) => {
      console.log({ open, isPaymentMode, pendingPayment });
      const paidOrder = data[0];
      if (paidOrder.orderNumber !== createdOrder?.orderNumber) return;

      useCartStore.getState().clear();
      if (isPaymentMode) toast.success('Payment received!');
      if (pendingPayment) {
        onCheckoutSuccess({
          order: paidOrder,
          items: pendingPayment.snapshot,
        });
      }
      form.reset();
      setPendingPayment(undefined);
      setCheckoutOpen(false);
    },
  });

  function onSubmit(data: PosCheckoutForm) {
    startTransition(async () => {
      const snapshot: CartItem[] = useCartStore.getState().items;
      if (snapshot.length === 0) {
        toast.error('Cart is empty.');
        setCheckoutOpen(false);
        return;
      }

      const result = await createOrderAction({
        notes: data.notes || undefined,
        items: snapshot.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: data.paymentMethod,
        ...(data.paymentMethod === PaymentMethod.CASH && { amount: amountTendered }),
      });

      if (!result.success || !result.data) {
        toast.error(result.error ?? 'Failed to create order.');
        return;
      }
      setCreatedOrder(result.data.order);

      const isCash = data.paymentMethod === PaymentMethod.CASH;

      if (isCash) {
        toast.success(`Order ${result.data.order.orderNumber} created successfully.`);
        useCartStore.getState().clear();
        onCheckoutSuccess({
          order: result.data.order,
          items: snapshot,
          amountTendered,
        });
        form.reset();
        setCheckoutOpen(false);
      } else {
        setPendingPayment({ ...result.data.order.payment!.midtransDetail!, snapshot });
      }
    });
  }

  const paymentMethod = useWatch({ control: form.control, name: 'paymentMethod' });
  const amountTendered = Number(useWatch({ control: form.control, name: 'amountTendered' })) || 0;
  const change = Math.max(0, amountTendered - total);

  const cartItems = useCartStore((state) => state.items);
  const isPaymentMode = !!pendingPayment;
  const isCash = paymentMethod === PaymentMethod.CASH;

  const paymentMethodOptions = [
    { value: PaymentMethod.CASH, label: 'Cash' },
    { value: PaymentMethod.QRIS, label: 'QRIS' },
    { value: PaymentMethod.VA_BCA, label: 'VA BCA' },
    { value: PaymentMethod.VA_BNI, label: 'VA BNI' },
    { value: PaymentMethod.VA_BRI, label: 'VA BRI' },
    { value: PaymentMethod.VA_MANDIRI, label: 'VA Mandiri' },
  ];

  function handleCopyVA() {
    if (pendingPayment?.vaNumber) {
      navigator.clipboard.writeText(pendingPayment.vaNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('VA number copied!');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        console.log(!isOpen && pendingPayment);
        if (!isOpen && pendingPayment) {
          setPendingPayment(undefined);
          useCartStore.getState().clear();
          form.reset();
        }
        setCheckoutOpen(isOpen);
      }}
    >
      <DialogContent className={cn('border-2 font-mono max-w-sm', isPaymentMode && 'md:max-w-4xl')}>
        <div className={cn('grid gap-0', isPaymentMode && 'md:grid-cols-2')}>
          <div className={cn(isPaymentMode && 'border-r-2 pr-6')}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <DialogHeader>
                <DialogTitle className="font-mono text-sm uppercase tracking-wider">
                  {isPaymentMode ? 'Order Receipt' : 'Checkout'}
                </DialogTitle>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {cartItems.length} Items
                </p>
              </DialogHeader>

              <OrderItems items={cartItems} />

              <FieldGroup className="gap-3">
                <Controller
                  name="notes"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel className="text-[10px] font-bold uppercase tracking-widest">
                        Notes
                      </FieldLabel>
                      <Textarea
                        id="notes"
                        placeholder="(optional)"
                        disabled={isPending || isPaymentMode}
                        className="font-mono text-sm resize-none"
                        rows={2}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    </Field>
                  )}
                />

                <Controller
                  name="paymentMethod"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel className="text-[10px] font-bold uppercase tracking-widest">
                        Payment Method
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isPending || isPaymentMode}
                      >
                        <SelectTrigger className="font-mono text-sm uppercase">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethodOptions.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="font-mono text-sm uppercase"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {isCash ? (
                  <Controller
                    name="amountTendered"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel className="text-[10px] font-bold uppercase tracking-widest">
                          Tendered
                        </FieldLabel>
                        <Input
                          id="amountTendered"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="0"
                          disabled={isPending || isPaymentMode}
                          aria-invalid={fieldState.invalid}
                          className="font-mono text-lg tabular-nums"
                          value={!field.value ? '' : field.value.toLocaleString('id-ID')}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            field.onChange(raw === '' ? 0 : Number(raw));
                          }}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Change Due
                          </span>
                          <span className="font-mono text-lg tabular-nums font-medium">
                            {formatCurrency(change)}
                          </span>
                        </div>
                      </Field>
                    )}
                  />
                ) : null}

                <div className="space-y-2 border-y-2 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Subtotal
                    </span>
                    <span className="font-mono text-lg tabular-nums">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {isCash && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Rounding
                      </span>
                      <span className="font-mono text-lg tabular-nums">
                        {formatCurrency(rounding)}
                      </span>
                    </div>
                  )}
                  <div className="border-t-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Total
                      </span>
                      <span className="font-mono text-xl font-bold tabular-nums">
                        {formatCurrency(isCash ? total : subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </FieldGroup>

              {!isPaymentMode && (
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCheckoutOpen(false)}
                    disabled={isPending}
                    className="font-mono uppercase text-xs tracking-wider"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="font-mono uppercase text-xs tracking-wider"
                  >
                    {isPending ? 'Processing...' : 'Complete Payment'}
                  </Button>
                </DialogFooter>
              )}
            </form>
          </div>

          {isPaymentMode && pendingPayment && createdOrder && (
            <div className="flex flex-col pl-6">
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
                  Payment Terminal
                </h3>
                {pendingPayment.expiryTime && (
                  <PaymentCountdown
                    order={{ ...createdOrder, snapshot: pendingPayment.snapshot }}
                    onCheckoutSuccess={onCheckoutSuccess}
                    expiryTime={pendingPayment.expiryTime}
                    setCheckoutOpen={setCheckoutOpen}
                    form={form}
                    setPendingPayment={setPendingPayment}
                  />
                )}
              </div>

              <div className="flex-1 flex items-center justify-center border-2 rounded-lg p-8 bg-muted/20">
                {pendingPayment.paymentType === 'qris' && pendingPayment.qrCodeUrl ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="text-center space-y-1">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                        Scan to Pay
                      </p>
                      <p className="text-2xl font-bold">QRIS</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border-2 shadow-sm">
                      <Image
                        width={200}
                        height={200}
                        src={pendingPayment.qrCodeUrl}
                        alt="QRIS QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                      Open your e-wallet app and scan this code to complete payment
                    </p>
                  </div>
                ) : pendingPayment.vaNumber ? (
                  <div className="flex flex-col items-center gap-6 w-full max-w-md">
                    <div className="text-center space-y-1">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                        Transfer to
                      </p>
                      <p className="text-2xl font-bold">
                        {paymentMethod === PaymentMethod.VA_BCA && 'BCA'}
                        {paymentMethod === PaymentMethod.VA_BNI && 'BNI'}
                        {paymentMethod === PaymentMethod.VA_BRI && 'BRI'}
                        {paymentMethod === PaymentMethod.VA_MANDIRI && 'Mandiri'}
                      </p>
                    </div>
                    <div className="w-full bg-card p-6 rounded-lg border-2 shadow-sm space-y-4">
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">
                          Virtual Account Number
                        </p>
                        <button
                          type="button"
                          onClick={handleCopyVA}
                          className={cn(
                            'w-full font-mono font-bold tabular-nums tracking-wider transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-center',
                            pendingPayment.vaNumber.length > 20
                              ? 'text-base sm:text-lg'
                              : pendingPayment.vaNumber.length > 14
                                ? 'text-lg sm:text-xl'
                                : 'text-xl sm:text-2xl',
                          )}
                          aria-label="Copy virtual account number"
                        >
                          {copied ? <Check className="mr-2 inline size-5 text-success" /> : null}
                          {pendingPayment.vaNumber}
                        </button>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Click account number to copy
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Use mobile banking or ATM to transfer to this account number
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
