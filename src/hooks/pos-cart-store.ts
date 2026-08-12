import _ from 'lodash';
import { create } from 'zustand';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  imagePath: string | null;
  imageUrl: string | null;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  inc: (productId: number) => void;
  dec: (productId: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  add: (item, quantity = 1) =>
    set((cart) => {
      const productId = item.productId;
      const existing = _.find(cart.items, { productId });

      if (existing)
        return {
          items: cart.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
          ),
        };

      return { items: [...cart.items, { ...item, quantity }] };
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

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0);
