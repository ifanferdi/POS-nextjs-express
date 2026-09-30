'use client';

import { PosPaymentModule } from '@/app/(pos)/_components/pos-payment-module';
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
import { CreatedOrder, PaymentMethod, PaymentMidtrans, PosLastOrder } from '@/domain';
import { createOrderAction } from '@/features/orders/action';
import { PosCheckoutForm, PosCheckoutFormSchema } from '@/features/orders/schema';
import { calculateRounding, formatCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { CartItem, useCartStore } from '../../../store/pos-cart-store';

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
    PaymentMidtrans & { snapshot: CartItem[] }
  >();
  const { rounding, total } = calculateRounding(subtotal);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder>();

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
        setPendingPayment({ ...result.data.order.payment, snapshot });
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
                          pattern="[0-9.]*"
                          placeholder="0"
                          disabled={isPending || isPaymentMode}
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
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">Payment</h3>
              <PosPaymentModule
                orderId={createdOrder.id}
                orderNumber={createdOrder.orderNumber}
                paymentMethod={paymentMethod}
                payment={pendingPayment}
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
                  onCheckoutSuccess({
                    order: createdOrder,
                    items: pendingPayment.snapshot,
                  });
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
