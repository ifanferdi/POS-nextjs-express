'use client';

import { PosCheckoutDialog } from '@/app/(pos)/_components/pos-checkout-dialog';
import { PosOrderHistoryDialog } from '@/app/(pos)/_components/pos-order-history-dialog';
import { DiscountBadge } from '@/components/shared/discount';
import { Button } from '@/components/ui/button';
import { PosLastOrder } from '@/domain';
import { formatCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardListIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  Trash2Icon,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import {
  cartCount,
  cartDiscount,
  cartSubtotal,
  cartTotal,
  splitCartItem,
  useCartStore,
} from '../../../store/pos-cart-store';

interface PosCartProps {
  onCheckoutSuccess: (result: PosLastOrder) => void;
}

export function PosCart({ onCheckoutSuccess }: PosCartProps) {
  const items = useCartStore((s) => s.items);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const setItem = useCartStore((s) => s.setItem);
  const remove = useCartStore((s) => s.remove);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const subtotal = cartSubtotal(items);
  const discount = cartDiscount(items);
  const total = cartTotal(items);
  const count = cartCount(items);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-primary/50 bg-card max-lg:max-h-[70dvh]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 border-b border-border/60 px-4 py-3 lg:hidden"
        aria-expanded={open}
      >
        <ShoppingBagIcon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold tracking-tight">Cart</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {count} item
        </span>
        <span className="ml-auto text-sm font-semibold text-muted-foreground tabular-nums">
          {formatCurrency(total)}
        </span>
        {open ? (
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        ) : (
          <ChevronUpIcon className="size-4 text-muted-foreground" />
        )}
      </button>

      <div className="hidden items-center gap-2 border-b border-border/60 px-4 py-3 lg:flex">
        <ShoppingBagIcon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold tracking-tight">Cart</h3>
        {items.length > 0 && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {items.length} item
          </span>
        )}
      </div>

      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto p-3 overscroll-contain',
          !open && 'max-lg:hidden',
        )}
      >
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <ShoppingBagIcon className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No items yet</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => {
              const split = splitCartItem(item);

              return (
                <li
                  key={item.productId}
                  className="flex gap-3 items-center rounded-lg border border-border/40 p-2.5 bg-muted-foreground/10 dark:bg-muted-foreground/10 hover:bg-muted-foreground/20 hover:dark:bg-muted-foreground/20 transition"
                >
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-card">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        className="size-full object-cover"
                        loading="lazy"
                        height={200}
                        width={200}
                      />
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => remove(item.productId)}
                        className="shrink-0 text-destructive/70 hover:text-destructive transition"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2Icon className="size-4" />
                      </button>
                    </div>

                    {split.promoQty > 0 && (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                        {split.promoQty} ×{' '}
                        <span className="font-semibold">
                          {formatCurrency(split.promoUnitPrice)}
                        </span>
                        <DiscountBadge price={item.price} amount={item.price - item.finalPrice} />
                      </p>
                    )}
                    {split.regularQty > 0 && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {split.regularQty} ×{' '}
                        <span className="font-semibold">{formatCurrency(item.price)}</span> (regular
                        price)
                      </p>
                    )}
                    {split.regularQty > 0 && split.promoQty > 0 && (
                      <p className="text-[10px] font-medium text-warning">Discount limit reached</p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => dec(item.productId)}
                          className="flex size-6 items-center justify-center rounded-md border transition text-muted-foreground hover:bg-primary hover:text-white dark:hover:text-black disabled:opacity-50"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <input
                          aria-label={`${item.name} quantity`}
                          type="text"
                          inputMode="numeric"
                          value={item.quantity}
                          onChange={(e) =>
                            setItem(item.productId, Number(e.target.value.replace(/\D/g, '')) || 0)
                          }
                          className="h-6 w-8 rounded-sm bg-transparent text-center text-sm font-medium tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => inc(item.productId)}
                          className="flex size-6 items-center justify-center rounded-md border text-gray-500 transition hover:bg-primary hover:text-white dark:hover:text-black disabled:opacity-50"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-primary tabular-nums">
                        {formatCurrency(split.total)}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={cn('border-t border-border/60 p-4', !open && 'max-lg:hidden')}>
        <dl className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium text-muted-foreground tabular-nums">
              {formatCurrency(subtotal)}
            </dd>
          </div>
          {discount > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Discount</dt>
              <dd className="font-medium tabular-nums">-{formatCurrency(discount)}</dd>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <dt className="font-medium">Estimated total</dt>
            <dd className="text-lg font-semibold text-muted-foreground tabular-nums">
              {formatCurrency(total)}
            </dd>
          </div>
        </dl>
        <Button
          className="mt-3 w-full"
          size="lg"
          disabled={items.length === 0}
          onClick={() => setCheckoutOpen(true)}
        >
          Checkout
        </Button>
        <Button
          variant="outline"
          className="mt-2 w-full"
          onClick={() => setHistoryOpen(true)}
          aria-label="Open order history"
        >
          <ClipboardListIcon />
          <span>Orders</span>
        </Button>
      </div>

      <PosCheckoutDialog
        open={checkoutOpen}
        setCheckoutOpen={setCheckoutOpen}
        onCheckoutSuccess={onCheckoutSuccess}
      />

      <PosOrderHistoryDialog open={historyOpen} setOpen={setHistoryOpen} />
    </div>
  );
}
