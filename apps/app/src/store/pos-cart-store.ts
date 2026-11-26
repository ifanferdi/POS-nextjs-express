import _ from 'lodash';
import { create } from 'zustand';

export interface CartItem {
  productId: number;
  name: string;
  /** Harga normal per unit. */
  price: number;
  /** Harga per unit saat diskon aktif; sama dengan `price` bila tidak ada diskon. */
  finalPrice: number;
  /** Sisa unit berdiskon saat ditambahkan; null = tanpa batas. */
  remainingQuota: number | null;
  imagePath: string | null;
  imageUrl: string | null;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  setItem: (productId: number, quantity: number) => void;
  inc: (productId: number) => void;
  dec: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  add: (item, quantity = 1) =>
    set((cart) => {
      const existing = _.find(cart.items, { productId: item.productId });
      if (existing)
        return {
          items: cart.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
          ),
        };

      return { items: [...cart.items, { ...item, quantity }] };
    }),
  setItem: (productId, quantity) =>
    set((cart) => {
      if (quantity <= 0) return { items: cart.items.filter((i) => i.productId !== productId) };

      return {
        items: cart.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      };
    }),
  inc: (productId) =>
    set((cart) => ({
      items: cart.items.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i,
      ),
    })),
  dec: (productId) =>
    set((cart) => {
      const existing = _.find(cart.items, { productId });
      if (existing?.quantity === 1)
        return { items: cart.items.filter((i) => i.productId !== productId) };

      return {
        items: cart.items.map((i) =>
          i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i,
        ),
      };
    }),
  remove: (productId) =>
    set((cart) => ({ items: cart.items.filter((i) => i.productId !== productId) })),
  clear: () => set({ items: [] }),
}));

export interface CartItemSplit {
  /** Unit yang dapat harga diskon (dibatasi sisa kuota). */
  promoQty: number;
  /** Unit yang tetap harga normal. */
  regularQty: number;
  /** Harga satuan pada baris promo. */
  promoUnitPrice: number;
  /** Total setelah diskon. */
  total: number;
}

/** Diskon otomatis dulu, sisa unit di atas kuota jatuh ke harga normal. */
export function splitCartItem(item: CartItem): CartItemSplit {
  const discountPerUnit = Math.max(0, item.price - item.finalPrice);
  const promoQty =
    discountPerUnit > 0 ? Math.min(item.quantity, item.remainingQuota ?? item.quantity) : 0;
  const regularQty = item.quantity - promoQty;

  return {
    promoQty,
    regularQty,
    promoUnitPrice: item.finalPrice,
    total: promoQty * item.finalPrice + regularQty * item.price,
  };
}

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + splitCartItem(i).total, 0);

export const cartDiscount = (items: CartItem[]) => cartSubtotal(items) - cartTotal(items);

export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0);

export interface CartOrderItem {
  productId: number;
  quantity: number;
  useDiscount?: boolean;
}

/** Baris payload: row promo dan row harga normal dipisah, promo lebih dulu. */
export function cartOrderItems(items: CartItem[]): CartOrderItem[] {
  return items.flatMap((item) => {
    const { promoQty, regularQty } = splitCartItem(item);
    return [
      ...(promoQty > 0
        ? [{ productId: item.productId, quantity: promoQty, useDiscount: true }]
        : []),
      ...(regularQty > 0 ? [{ productId: item.productId, quantity: regularQty }] : []),
    ];
  });
}

/** Hanya unit promo, untuk pre-check kuota sebelum create order. */
export function cartPromoUnits(items: CartItem[]) {
  return items.flatMap((item) => {
    const { promoQty } = splitCartItem(item);
    return promoQty > 0 ? [{ productId: item.productId, quantity: promoQty }] : [];
  });
}
