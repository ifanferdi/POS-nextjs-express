'use client';

import { PosCart } from '@/app/(pos)/_components/pos-cart';
import { PosProductGrid } from '@/app/(pos)/_components/pos-product-grid';
import { PosReceipt } from '@/app/(pos)/_components/pos-receipt';
import { CategoryOption, PosLastOrder, ProductDetail } from '@/domain';
import { CartItem, useCartStore } from '@/hooks/pos-cart-store';
import { useState } from 'react';

interface PosViewProps {
  products: ProductDetail[];
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
    <div className="flex h-full flex-col p-4 md:p-6 lg:grid lg:grid-cols-[1fr_400px] lg:gap-6">
      <section className="min-h-0 flex-1 overflow-hidden lg:pb-0 print:hidden">
        <PosProductGrid
          products={products}
          totalProducts={totalProducts}
          categories={categories}
          onAdd={handleAdd}
        />
      </section>

      <aside className="min-h-0 max-lg:fixed bg-white max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-20 max-lg:px-3 max-lg:py-3 lg:max-h-[calc(100vh-7rem)]">
        <PosCart onCheckoutSuccess={setLastOrder} />
      </aside>

      {lastOrder && lastOrder.order.payment?.status === 'success' ? (
        <PosReceipt lastOrder={lastOrder} onNewTransaction={() => setLastOrder(null)} />
      ) : null}
    </div>
  );
}
