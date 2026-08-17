'use client';

import { PosCart } from '@/app/(pos)/_components/pos-cart';
import { PosProductGrid } from '@/app/(pos)/_components/pos-product-grid';
import { CategoryOption, Order, Product } from '@/domain';
import { CartItem, useCartStore } from '@/hooks/pos-cart-store';
import { useState } from 'react';
import { PosReceipt } from '@/app/(pos)/_components/pos-receipt';

export interface PosLastOrder {
  order: Order;
  items: CartItem[];
  amountTendered?: number;
}

interface PosViewProps {
  products: Product[];
  totalProducts: number;
  categories: CategoryOption[];
}

export function PosView({ products, totalProducts, categories }: PosViewProps) {
  const [lastOrder, setLastOrder] = useState<PosLastOrder | null>(null);
  const addItem = useCartStore((s) => s.add);

  // ponytail: saat struk tampil & cashier tambah produk → mulai transaksi baru otomatis.
  // Disinkronkan di add site (bukan useEffect) supaya setState tidak di effect body.
  function handleAdd(item: Omit<CartItem, 'quantity'>, quantity?: number) {
    if (lastOrder) setLastOrder(null);
    addItem(item, quantity);
  }

  return (
    <div className="grid h-full grid-cols-1 gap-6 p-4 md:p-6 lg:grid-cols-[1fr_400px]">
      <section className="min-h-0 overflow-hidden print:hidden">
        <PosProductGrid
          products={products}
          totalProducts={totalProducts}
          categories={categories}
          onAdd={handleAdd}
        />
      </section>

      <aside className="min-h-0 lg:max-h-[calc(100vh-7rem)]">
        <PosCart onCheckoutSuccess={setLastOrder} />
      </aside>

      {lastOrder && (
        <PosReceipt lastOrder={lastOrder} onNewTransaction={() => setLastOrder(null)} />
      )}
    </div>
  );
}
