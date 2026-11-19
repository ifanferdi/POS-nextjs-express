'use client';

import { PosPaymentModule } from '@/app/(pos)/_components/pos-payment-module';
import { DiscountBadge } from '@/components/shared/discount';
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
import {
  DiscountQuotaShortage,
  OrderApiResponse,
  PaymentMethod,
  PaymentMidtrans,
  PosLastOrder,
} from '@/domain';
import { createOrderAction, type CreateOrderActionResult } from '@/features/orders/action';
import { CreateOrderInput, PosCheckoutForm, PosCheckoutFormSchema } from '@/features/orders/schema';
import { checkProductDiscountQuotaAction } from '@/features/product-discount-cycles/action';
import { calculateRounding, formatCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState, useTransition } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import {
  CartItem,
  cartDiscount,
  cartOrderItems,
  cartPromoUnits,
  cartSubtotal,
  cartTotal,
  splitCartItem,
  useCartStore,
} from '../../../store/pos-cart-store';

function OrderItems({ items }: { items: CartItem[] }) {
  return (
    <div className="max-h-40 divide-y border-y-2 overflow-y-auto">
      {items.map((item) => {
        const split = splitCartItem(item);

        return (
          <div key={item.productId} className="space-y-1 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="shrink-0 font-bold tabular-nums text-muted-foreground">
                {item.quantity}×
              </span>
              <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
              <span className="shrink-0 font-mono text-muted-foreground tabular-nums">
                {formatCurrency(split.total)}
              </span>
            </div>
            {split.promoQty > 0 && (
              <div className="flex items-center gap-2 pl-6 text-[11px] text-muted-foreground tabular-nums">
                <span className="flex-1">
                  {split.promoQty} × {formatCurrency(split.promoUnitPrice)}
                </span>
                <DiscountBadge price={item.price} amount={item.price - item.finalPrice} />
              </div>
            )}
            {split.regularQty > 0 && (
              <div className="flex items-center gap-2 pl-6 text-[11px] text-muted-foreground tabular-nums">
                <span className="flex-1">
                  {split.regularQty} × {formatCurrency(item.price)} regular
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface PosCheckoutDialogProps {
  open: boolean;
  setCheckoutOpen: (open: boolean) => void;
  onCheckoutSuccess: (result: PosLastOrder) => void;
}
type CheckoutAttempt = {
  key: string;
  input: CreateOrderInput;
  snapshot: CartItem[];
};

type UnknownOrderResult = { error: string; status?: number };
export function PosCheckoutDialog({
  open,
  setCheckoutOpen,
  onCheckoutSuccess,
}: PosCheckoutDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);
  const [shortages, setShortages] = useState<DiscountQuotaShortage[]>([]);
  const [pendingPayment, setPendingPayment] = useState<
    PaymentMidtrans & { snapshot: CartItem[] }
  >();
  const [createdOrder, setCreatedOrder] = useState<OrderApiResponse['order']>();
  const [attempt, setAttempt] = useState<CheckoutAttempt | null>(null);
  const [unknownResult, setUnknownResult] = useState<UnknownOrderResult | null>(null);
  const requestInFlight = useRef(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setShortages([]);
    }
  }

  const cartItems = useCartStore((state) => state.items);
  const checkoutItems = unknownResult && attempt ? attempt.snapshot : cartItems;
  const subtotal = cartSubtotal(checkoutItems);
  const discount = cartDiscount(checkoutItems);
  const net = cartTotal(checkoutItems);
  const promoUnits = cartPromoUnits(checkoutItems);
  const { rounding, total } = calculateRounding(net);

  const form = useForm<PosCheckoutForm>({
    resolver: zodResolver(PosCheckoutFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      paymentMethod: PaymentMethod.CASH,
      notes: '',
      amountTendered: 0,
    },
  });

  function onSubmit(data: PosCheckoutForm) {
    if (requestInFlight.current || unknownResult) return;
    requestInFlight.current = true;

    startTransition(async () => {
      try {
        const snapshot = useCartStore.getState().items.map((item) => ({ ...item }));
        if (snapshot.length === 0) {
          toast.error('Cart is empty.');
          setCheckoutOpen(false);
          return;
        }

        const isCash = data.paymentMethod === PaymentMethod.CASH;
        const amountTendered = data.amountTendered ?? 0;

        if (isCash && amountTendered < total) {
          form.setError('amountTendered', {
            message: 'Amount tendered cannot be less than the total.',
          });
          return;
        }

        setShortages([]);

        const promoUnits = cartPromoUnits(snapshot);
        if (promoUnits.length > 0) {
          setIsCheckingQuota(true);
          try {
            const check = await checkProductDiscountQuotaAction(promoUnits);
            if (!check.valid) {
              if (check.shortages.length > 0) {
                setShortages(check.shortages);
                return;
              }

              // Check bersifat advisory: error izin/jaringan tidak boleh memblokir penjualan.
              if (check.error) toast.error(check.error);
            }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to check discount quota.');
          } finally {
            setIsCheckingQuota(false);
          }
        }

        const attempt: CheckoutAttempt = {
          key: crypto.randomUUID(),
          input: {
            notes: data.notes || undefined,
            items: cartOrderItems(snapshot),
            paymentMethod: data.paymentMethod,
            ...(isCash && { amount: amountTendered }),
          },
          snapshot,
        };
        setAttempt(attempt);

        let result: CreateOrderActionResult;
        try {
          result = await createOrderAction(attempt.input, attempt.key);
        } catch (error) {
          setUnknownResult({
            error:
              error instanceof Error ? error.message : 'The checkout action returned no result.',
          });
          toast.error('Order status is unknown. Check Order History before continuing.');
          return;
        }

        if (!result.success) {
          if (result.ambiguous) {
            setUnknownResult({ error: result.error, status: result.status });
            toast.error('Order status is unknown. Check Order History before continuing.');
          } else {
            setAttempt(null);
            toast.error(result.error);
          }
          return;
        }

        setAttempt(null);
        setUnknownResult(null);
        setCreatedOrder(result.data);

        if (isCash) {
          toast.success(
            result.status === 200
              ? `Order ${result.data.orderNumber} already exists. Showing its receipt.`
              : `Order ${result.data.orderNumber} created successfully.`,
          );
          useCartStore.getState().clear();
          onCheckoutSuccess(result.data);
          form.reset();
          setCheckoutOpen(false);
        } else {
          if (result.status === 200) {
            toast.success(`Order ${result.data.orderNumber} already exists. Continuing payment.`);
          }
          setPendingPayment({ ...result.data.payment, snapshot });
        }
      } finally {
        requestInFlight.current = false;
      }
    });
  }

  const paymentMethod = useWatch({ control: form.control, name: 'paymentMethod' });
  const amountTendered = Number(useWatch({ control: form.control, name: 'amountTendered' })) || 0;
  const change = Math.max(0, amountTendered - total);
  const isPaymentMode = !!pendingPayment;
  const isCash = paymentMethod === PaymentMethod.CASH;
  const isBusy = isPending || isCheckingQuota;
  const hasUnknownOutcome = unknownResult !== null;

  const paymentMethodOptions = [
    { value: PaymentMethod.CASH, label: 'Cash' },
    { value: PaymentMethod.QRIS, label: 'QRIS' },
    { value: PaymentMethod.VA_BCA, label: 'VA BCA' },
    { value: PaymentMethod.VA_BNI, label: 'VA BNI' },
    { value: PaymentMethod.VA_BRI, label: 'VA BRI' },
    { value: PaymentMethod.VA_MANDIRI, label: 'VA Mandiri' },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && (isBusy || requestInFlight.current)) return;
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
            <form
              onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
              className="space-y-3"
            >
              <DialogHeader>
                <DialogTitle className="font-mono text-sm uppercase tracking-wider">
                  {isPaymentMode ? 'Order Receipt' : 'Checkout'}
                </DialogTitle>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {checkoutItems.length} Items
                </p>
              </DialogHeader>

              <OrderItems items={checkoutItems} />

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
                        disabled={isBusy || isPaymentMode || hasUnknownOutcome}
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
                        disabled={isBusy || isPaymentMode || hasUnknownOutcome}
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
                          pattern="[0-9.]*"
                          placeholder="0"
                          disabled={isBusy || isPaymentMode || hasUnknownOutcome}
                          aria-invalid={fieldState.invalid}
                          className="font-mono text-lg tabular-nums"
                          value={!field.value ? '' : field.value.toLocaleString('id-ID')}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            field.onChange(raw === '' ? 0 : Number(raw));
                          }}
                          onFocus={(e) => e.target.select()}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Change Due
                          </span>
                          <span className="font-mono text-lg text-muted-foreground tabular-nums font-medium">
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
                    <span className="font-mono text-lg text-muted-foreground tabular-nums">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Discount
                      </span>
                      <span className="font-mono text-lg text-muted-foreground tabular-nums">
                        -{formatCurrency(discount)}
                      </span>
                    </div>
                  )}
                  {isCash && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Rounding
                      </span>
                      <span className="font-mono text-lg text-muted-foreground tabular-nums">
                        {formatCurrency(rounding)}
                      </span>
                    </div>
                  )}
                  <div className="border-t-2 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Total
                      </span>
                      <span className="font-mono text-xl text-muted-foreground font-bold tabular-nums">
                        {formatCurrency(isCash ? total : net)}
                      </span>
                    </div>
                  </div>
                </div>
              </FieldGroup>

              {unknownResult && attempt && (
                <div
                  role="alert"
                  className="space-y-3 rounded-md border border-warning/40 bg-warning/5 p-3 text-xs"
                >
                  <p className="font-semibold">Order status is unknown.</p>
                  <p>
                    The server did not confirm whether this order was saved. Do not submit it again.
                    Close checkout and check Order History across all statuses for a matching order
                    before starting another sale. If you cannot rule out a match, leave this
                    checkout unresolved.
                  </p>
                  <p>
                    {unknownResult.status !== undefined
                      ? `Server response: HTTP ${unknownResult.status}. ${unknownResult.error}`
                      : `No HTTP status was available. ${unknownResult.error}`}
                  </p>
                </div>
              )}

              {shortages.length > 0 && (
                <div
                  role="alert"
                  className="space-y-1 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs"
                >
                  <p className="font-bold text-destructive">Discount quota is not enough</p>
                  <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                    {shortages.map((shortage) => {
                      const index = cartItems.findIndex(
                        (item) => item.productId === shortage.productId,
                      );
                      const requested =
                        promoUnits.find((item) => item.productId === shortage.productId)
                          ?.quantity ?? 0;

                      return (
                        <li key={shortage.productId}>
                          Product {index + 1} ({cartItems[index]?.name ?? shortage.productId}):{' '}
                          {shortage.itemLeft} discount {shortage.itemLeft === 1 ? 'unit' : 'units'}{' '}
                          left, you requested {requested}.
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-muted-foreground">
                    Reduce the quantity or sell the rest at regular price.
                  </p>
                </div>
              )}

              {!isPaymentMode && (
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!requestInFlight.current) setCheckoutOpen(false);
                    }}
                    disabled={isBusy}
                    className="font-mono uppercase text-xs tracking-wider"
                  >
                    {hasUnknownOutcome ? 'Close checkout' : 'Cancel'}
                  </Button>
                  {!hasUnknownOutcome && (
                    <Button
                      type="submit"
                      disabled={isBusy}
                      className="font-mono uppercase text-xs tracking-wider"
                    >
                      {isCheckingQuota
                        ? 'Checking quota...'
                        : isPending
                          ? 'Processing...'
                          : 'Complete Payment'}
                    </Button>
                  )}
                </DialogFooter>
              )}
            </form>
          </div>

          {isPaymentMode && pendingPayment && createdOrder && (
            <div className="flex flex-col pl-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Payment</h3>
              <PosPaymentModule
                orderId={createdOrder.id}
                orderNumber={createdOrder.orderNumber}
                paymentMethod={paymentMethod}
                payment={pendingPayment}
                onPaid={(paidPayment) => {
                  if (createdOrder) {
                    onCheckoutSuccess({
                      ...createdOrder,
                      payment: {
                        ...createdOrder.payment,
                        ...paidPayment,
                        midtransDetail: createdOrder.payment.midtransDetail,
                      },
                    });
                  }
                  useCartStore.getState().clear();
                  toast.success('Payment received!');
                  form.reset();
                  setPendingPayment(undefined);
                  setCheckoutOpen(false);
                }}
                onExpired={() => {
                  toast.error('Payment expired!');
                  useCartStore.getState().clear();
                  form.reset();
                  setPendingPayment(undefined);
                  setCheckoutOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
