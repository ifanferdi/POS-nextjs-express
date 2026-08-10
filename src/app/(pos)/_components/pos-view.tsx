'use client';

import { PosCart } from '@/app/(pos)/_components/pos-cart';
import { PosProductGrid } from '@/app/(pos)/_components/pos-product-grid';
import { PosReceipt } from '@/app/(pos)/_components/pos-receipt';
import { CategoryOption, Order, Product } from '@/domain';
import { CartItem, useCartStore } from '@/stores/pos-cart-store';
import { useState } from 'react';

export interface PosLastOrder {
  order: Order;
  items: CartItem[];
  amountTendered?: number;
}

interface PosViewProps {
  cashierId: number;
  cashierName: string;
  products: Product[];
  totalProducts: number;
  categories: CategoryOption[];
}

export function PosView({
  cashierId,
  cashierName,
  products,
  totalProducts,
  categories,
}: PosViewProps) {
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
        {lastOrder ? (
          <PosReceipt
            lastOrder={lastOrder}
            cashierName={cashierName}
            onNewTransaction={() => setLastOrder(null)}
          />
        ) : (
          <PosCart cashierId={cashierId} onCheckoutSuccess={setLastOrder} />
        )}
      </aside>
    </div>
  );
}