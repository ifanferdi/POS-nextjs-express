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
import { PAYMENT_METHOD_VALUES, PaymentMethod } from '@/domain';
import { createOrderAction } from '@/features/orders/action';
import { PosCheckoutForm, PosCheckoutFormSchema } from '@/features/orders/schema';
import { formatCurrency } from '@/lib/helper';
import { CartItem, useCartStore } from '@/stores/pos-cart-store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useTransition } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.CARD]: 'Card',
  [PaymentMethod.TRANSFER]: 'Transfer',
};

interface PosCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashierId: number;
  subtotal: number;
  onCheckoutSuccess: (result: PosLastOrder) => void;
}
export function PosCheckoutDialog({
  open,
  onOpenChange,
  cashierId,
  subtotal,
  onCheckoutSuccess,
}: PosCheckoutDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<PosCheckoutForm>({
    resolver: zodResolver(PosCheckoutFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      subtotal,
      paymentMethod: PaymentMethod.CASH,
      notes: '',
      amountTendered: 0,
      paymentReference: '',
    },
  });

  // defaultValues hanya berlaku saat mount. Sync subtotal ke form state
  // saat prop berubah (cart bertambah/berkurang) supaya superRefine validasi pakai nilai terbaru.
  useEffect(() => {
    form.setValue('subtotal', subtotal);
  }, [subtotal, form]);

  function onSubmit(data: PosCheckoutForm) {
    startTransition(async () => {
      const snapshot: CartItem[] = useCartStore.getState().items;
      if (snapshot.length === 0) {
        toast.error('Keranjang kosong.');
        onOpenChange(false);
        return;
      }

      const result = await createOrderAction({
        userId: cashierId,
        notes: data.notes || undefined,
        items: snapshot.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: data.paymentMethod,
        paymentReference: data.paymentReference,
        amount: amountTendered,
      });

      if (!result.success || !result.data) {
        toast.error(result.error ?? 'Gagal membuat order.');
        return;
      }

      useCartStore.getState().clear();
      onCheckoutSuccess({
        order: result.data,
        items: snapshot,
        amountTendered: data.paymentMethod === PaymentMethod.CASH ? amountTendered : undefined,
      });
      form.reset();
      onOpenChange(false);
      toast.success(`Order ${result.data.orderNumber} berhasil dibuat.`);
    });
  }

  const paymentMethod = useWatch({ control: form.control, name: 'paymentMethod' });
  const amountTendered = Number(useWatch({ control: form.control, name: 'amountTendered' })) || 0;
  const change = Math.max(0, amountTendered - subtotal);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimasi Subtotal</span>
              <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <FieldGroup>
            <Controller
              name="paymentMethod"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="paymentMethod">Metode Pembayaran</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as PaymentMethod)}
                    disabled={isPending}
                  >
                    <SelectTrigger
                      id="paymentMethod"
                      aria-invalid={fieldState.invalid}
                      className="w-full"
                    >
                      <SelectValue placeholder="Pilih metode" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      {PAYMENT_METHOD_VALUES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {PAYMENT_LABELS[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {paymentMethod === PaymentMethod.CASH ? (
              <Controller
                name="amountTendered"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="amountTendered">Uang Diterima</FieldLabel>
                    <Input
                      id="amountTendered"
                      type="number"
                      min={0}
                      step={100}
                      disabled={isPending}
                      aria-invalid={fieldState.invalid}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    <p className="text-xs text-muted-foreground">
                      Kembalian: <span className="font-medium">{formatCurrency(change)}</span>
                    </p>
                  </Field>
                )}
              />
            ) : (
              <Controller
                name="paymentReference"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="paymentReference">Referensi Pembayaran</FieldLabel>
                    <Input
                      id="paymentReference"
                      disabled={isPending}
                      aria-invalid={fieldState.invalid}
                      value={field.value}
                      placeholder="ID Transaksi / No. Rekening / No. Kartu"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}

            <Controller
              name="notes"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="notes">Catatan</FieldLabel>
                  <Textarea
                    id="notes"
                    placeholder="(opsional)"
                    disabled={isPending}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                </Field>
              )}
            />
          </FieldGroup>
{/* 
          <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            Total final (pajak &amp; diskon) dihitung backend setelah submit.
          </div> */}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Memproses...' : 'Proses Checkout'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
