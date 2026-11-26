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
import { createOrderAction } from '@/features/orders/action';
import { PosCheckoutForm, PosCheckoutFormSchema } from '@/features/orders/schema';
import { checkProductDiscountQuotaAction } from '@/features/product-discount-cycles/action';
import { calculateRounding, formatCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
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
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setIdempotencyKey(crypto.randomUUID());
      setShortages([]);
    }
  }

  const cartItems = useCartStore((state) => state.items);
  const subtotal = cartSubtotal(cartItems);
  const discount = cartDiscount(cartItems);
  const net = cartTotal(cartItems);
  const promoUnits = cartPromoUnits(cartItems);
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
    startTransition(async () => {
      const snapshot: CartItem[] = useCartStore.getState().items;
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
        const check = await checkProductDiscountQuotaAction(promoUnits);
        setIsCheckingQuota(false);

        if (!check.valid) {
          if (check.shortages.length > 0) {
            setShortages(check.shortages);
            return;
          }

          // Check bersifat advisory: error izin/jaringan tidak boleh memblokir penjualan.
          if (check.error) toast.error(check.error);
        }
      }

      const key = idempotencyKey || crypto.randomUUID();
      if (!idempotencyKey) setIdempotencyKey(key);

      const result = await createOrderAction(
        {
          notes: data.notes || undefined,
          items: cartOrderItems(snapshot),
          paymentMethod: data.paymentMethod,
          ...(isCash && { amount: amountTendered }),
        },
        key,
      );

      if (!result.success || !result.data) {
        toast.error(result.error ?? 'Failed to create order.');
        return;
      }
      setCreatedOrder(result.data);

      if (isCash) {
        toast.success(`Order ${result.data.orderNumber} created successfully.`);
        useCartStore.getState().clear();
        onCheckoutSuccess(result.data);
        form.reset();
        setCheckoutOpen(false);
      } else {
        setPendingPayment({ ...result.data.payment, snapshot });
      }
    });
  }

  const paymentMethod = useWatch({ control: form.control, name: 'paymentMethod' });
  const amountTendered = Number(useWatch({ control: form.control, name: 'amountTendered' })) || 0;
  const change = Math.max(0, amountTendered - total);
  const isPaymentMode = !!pendingPayment;
  const isCash = paymentMethod === PaymentMethod.CASH;
  const isBusy = isPending || isCheckingQuota;

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
                        disabled={isBusy || isPaymentMode}
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
                        disabled={isBusy || isPaymentMode}
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
                          disabled={isBusy || isPaymentMode}
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
                    onClick={() => setCheckoutOpen(false)}
                    disabled={isBusy}
                    className="font-mono uppercase text-xs tracking-wider"
                  >
                    Cancel
                  </Button>
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
                onCheckoutSuccess={onCheckoutSuccess}
                onPaid={() => {
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
