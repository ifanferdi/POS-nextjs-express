'use client';

import { PosCart } from '@/app/(pos)/_components/pos-cart';
import { PosProductGrid } from '@/app/(pos)/_components/pos-product-grid';
import { PosReceipt } from '@/app/(pos)/_components/pos-receipt';
import { CategoryOption, Order, Product } from '@/domain';
import { CartItem, useCartStore } from '@/hooks/pos-cart-store';
import { useState } from 'react';

export interface PosLastOrder {
  order: Order;
  items: CartItem[];
  amountTendered?: number;
  qrCodeUrl?: string;
  vaNumber?: string;
  paymentType?: string;
  expiryTime?: string;
}

interface PosViewProps {
  products: Product[];
  totalProducts: number;
  categories: CategoryOption[];
}

export function PosView({ products, totalProducts, categories }: PosViewProps) {
  const [lastOrder, setLastOrder] = useState<PosLastOrder | null>(null);
  const addItem = useCartStore((s) => s.add);

  // ponytail: when receipt is shown & cashier adds product → auto-start new transaction.
  // Synced at add site (not useEffect) so setState is not in effect body.
  function handleAdd(item: Omit<CartItem, 'quantity'>, quantity?: number) {
    if (lastOrder) setLastOrder(null);
    addItem(item, quantity);
  }

  return (
    <div className="flex h-full flex-col p-4 lg:grid lg:grid-cols-[1fr_400px] lg:gap-4">
      <section className="min-h-0 flex-1 overflow-hidden lg:pb-0 print:hidden">
        <PosProductGrid
          products={products}
          totalProducts={totalProducts}
          categories={categories}
          onAdd={handleAdd}
        />
      </section>

      <aside className="min-h-0 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-20 max-lg:px-3 max-lg:py-3 max-lg:shadow-[0_-4px_12px_rgb(0_0_0/0.08)]">
        <PosCart onCheckoutSuccess={setLastOrder} />
      </aside>

      {lastOrder && lastOrder.order.payment?.status === 'success' ? (
        <PosReceipt lastOrder={lastOrder} onNewTransaction={() => setLastOrder(null)} />
      ) : null}
    </div>
  );
}
