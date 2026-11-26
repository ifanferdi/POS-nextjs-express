'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProductDiscountCycleList } from '@/domain';
import {
  createProductDiscountCycleAction,
  updateProductDiscountCycleAction,
} from '@/features/product-discount-cycles/action';
import {
  UpdateProductDiscountCycleInput,
  UpdateProductDiscountCycleSchema,
} from '@/features/product-discount-cycles/schema';
import { formatCurrency, getDiscountPercentage } from '@/lib/helper';
import { zodResolver } from '@hookform/resolvers/zod';
import moment from 'moment';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

export interface DiscountProductOption {
  id: number;
  name: string;
  price: number;
}

interface DiscountCycleFormDialogProps {
  products: DiscountProductOption[];
  cycle?: ProductDiscountCycleList;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscountCycleFormDialog(props: DiscountCycleFormDialogProps) {
  const { products, cycle, open, onOpenChange } = props;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-4rem)] flex flex-col p-0 gap-0 lg:max-w-xl">
        <DiscountCycleForm products={products} cycle={cycle} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function DiscountCycleForm({
  products,
  cycle,
  onClose,
}: Omit<DiscountCycleFormDialogProps, 'open' | 'onOpenChange'> & { onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEdit = !!cycle;
  const [selectedProduct, setSelectedProduct] = useState<DiscountProductOption | null>(() => {
    if (!cycle) return null;

    return (
      cycle.product ??
      products.find((product) => product.id === cycle.productId) ?? {
        id: cycle.productId,
        name: `Product ${cycle.productId}`,
        price: 0,
      }
    );
  });

  const form = useForm<UpdateProductDiscountCycleInput>({
    resolver: zodResolver(UpdateProductDiscountCycleSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      amount: cycle?.amount ?? 0,
      quota: cycle?.quota ?? undefined,
      startDate: cycle ? moment(cycle.startDate).format('YYYY-MM-DDTHH:mm') : '',
      endDate: cycle ? moment(cycle.endDate).format('YYYY-MM-DDTHH:mm') : '',
    },
  });

  const amount = Number(useWatch({ control: form.control, name: 'amount' })) || 0;
  const startDate = useWatch({ control: form.control, name: 'startDate' });
  const productPrice = selectedProduct?.price ?? 0;
  const finalPrice = Math.max(0, productPrice - amount);

  const onSubmit = (input: UpdateProductDiscountCycleInput) =>
    startTransition(async () => {
      if (!selectedProduct) {
        toast.error('Select a product first.');
        return;
      }

      const price = selectedProduct.price;

      if (price > 0 && Number(input.amount) > price) {
        form.setError('amount', {
          message: 'Discount cannot be more than the product price.',
        });
        return;
      }

      const payload = {
        amount: Number(input.amount),
        quota: input.quota === undefined ? undefined : Number(input.quota),
        startDate: new Date(input.startDate).toISOString(),
        endDate: new Date(input.endDate).toISOString(),
      };

      const result = isEdit
        ? await updateProductDiscountCycleAction(cycle.id, payload)
        : await createProductDiscountCycleAction({
            ...payload,
            productId: selectedProduct.id,
          });

      if (!result.success) {
        const message = result.error ?? 'Something went wrong.';

        if (message.toLowerCase().includes('harga produk')) form.setError('amount', { message });
        else if (message.toLowerCase().includes('end date')) form.setError('endDate', { message });
        else toast.error(message);

        return;
      }

      toast.success(isEdit ? 'Discount cycle updated.' : 'Discount cycle created.');
      router.refresh();
      onClose();
    });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="shrink-0 border-b px-6 py-4">
        <DialogTitle>{isEdit ? 'Edit discount cycle' : 'New discount cycle'}</DialogTitle>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor={isEdit ? undefined : 'productId'}>Product</FieldLabel>
            {isEdit ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-input px-2.5 py-1.5 text-sm">
                <span className="min-w-0 truncate">{selectedProduct?.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(productPrice)}
                </span>
              </div>
            ) : (
              <Select
                value={selectedProduct ? String(selectedProduct.id) : undefined}
                onValueChange={(value) =>
                  setSelectedProduct(products.find((item) => item.id === Number(value)) ?? null)
                }
                disabled={isPending}
              >
                <SelectTrigger id="productId" className="w-full">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      {product.name} · {formatCurrency(product.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FieldDescription>
              {productPrice > 0
                ? `Regular price ${formatCurrency(productPrice)}. Discount cannot be more than this.`
                : 'Pick the product this discount applies to.'}
            </FieldDescription>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="amount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="amount">Discount amount</FieldLabel>
                  <Input
                    id="amount"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="0"
                    aria-invalid={fieldState.invalid}
                    disabled={isPending}
                    value={Number(field.value) === 0 ? '' : field.value}
                    onChange={(event) =>
                      field.onChange(event.target.value === '' ? 0 : Number(event.target.value))
                    }
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>
                      Final price {formatCurrency(finalPrice)}
                      {productPrice > 0 && amount > 0 && amount <= productPrice && (
                        <span className="ml-1 font-medium tabular-nums">
                          (-{getDiscountPercentage(productPrice, amount)}%)
                        </span>
                      )}
                    </FieldDescription>
                  )}
                </Field>
              )}
            />

            <Controller
              name="quota"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="quota">Quota (optional)</FieldLabel>
                  <Input
                    id="quota"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="Unlimited"
                    aria-invalid={fieldState.invalid}
                    disabled={isPending}
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === '' ? undefined : Number(event.target.value),
                      )
                    }
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>
                      Units that get the discount. Leave empty for unlimited.
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="startDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="startDate">Starts</FieldLabel>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    aria-invalid={fieldState.invalid}
                    disabled={isPending}
                    className="scheme-light dark:scheme-dark"
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="endDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="endDate">Ends</FieldLabel>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    min={startDate || undefined}
                    aria-invalid={fieldState.invalid}
                    disabled={isPending}
                    className="scheme-light dark:scheme-dark"
                    {...field}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
        </FieldGroup>
      </div>

      <DialogFooter className="mx-0 mb-0 shrink-0 border-t px-6 py-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : isEdit ? 'Save changes' : 'Create cycle'}
        </Button>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isPending}>
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </form>
  );
}
