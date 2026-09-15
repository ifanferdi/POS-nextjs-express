'use client';

import { PosCheckoutDialog } from '@/app/(pos)/_components/pos-checkout-dialog';
import { Button } from '@/components/ui/button';
import { PosLastOrder } from '@/domain';
import { cartCount, cartSubtotal, useCartStore } from '@/hooks/pos-cart-store';
import { formatCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  MinusIcon,
  PlusIcon,
  ShoppingBagIcon,
  Trash2Icon,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface PosCartProps {
  onCheckoutSuccess: (result: PosLastOrder) => void;
}

export function PosCart({ onCheckoutSuccess }: PosCartProps) {
  const items = useCartStore((s) => s.items);
  const inc = useCartStore((s) => s.inc);
  const dec = useCartStore((s) => s.dec);
  const remove = useCartStore((s) => s.remove);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const subtotal = cartSubtotal(items);
  const count = cartCount(items);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border/60 bg-card max-lg:max-h-[70dvh]">
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
        <span className="ml-auto text-sm font-semibold tabular-nums" suppressHydrationWarning>
          {formatCurrency(subtotal)}
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
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex gap-3 items-center rounded-lg border border-border/40 p-2.5 bg-muted/50 dark:bg-muted/50 transition hover:bg-muted dark:hover:bg-muted"
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
                      className="shrink-0 text-muted-foreground transition hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(item.price)} · Stock: {item.stock}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => dec(item.productId)}
                        className="flex size-6 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition hover:bg-primary/40 hover:text-white disabled:opacity-50"
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon className="size-3.5" />
                      </button>
                      <span className="min-w-6 text-center text-sm font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => inc(item.productId)}
                        className="flex size-6 items-center justify-center rounded-md border border-border/60 text-muted-foreground transition hover:bg-primary/40 hover:text-white disabled:opacity-50"
                        aria-label="Increase quantity"
                      >
                        <PlusIcon className="size-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={cn('border-t border-border/60 p-4', !open && 'max-lg:hidden')}>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <InfoIcon className="size-3.5" />
          <span>Tax included.</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Subtotal Estimate</span>
          <span className="text-lg font-semibold tabular-nums" suppressHydrationWarning>
            {formatCurrency(subtotal)}
          </span>
        </div>
        <Button
          className="mt-3 w-full"
          size="lg"
          disabled={items.length === 0}
          onClick={() => setCheckoutOpen(true)}
        >
          Checkout
        </Button>
      </div>

      <PosCheckoutDialog
        open={checkoutOpen}
        setCheckoutOpen={setCheckoutOpen}
        subtotal={subtotal}
        onCheckoutSuccess={onCheckoutSuccess}
      />
    </div>
  );
}
