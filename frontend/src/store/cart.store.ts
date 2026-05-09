/**
 * Global Cart Store — persisted in localStorage so the cart survives page refreshes.
 * Used across the storefront: ProductDetail (add), CartPage (view/edit), Layout (badge count).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  price: number;
  qty: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  updateQty: (variantId: string, qty: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(i => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.variantId === item.variantId ? { ...i, qty: i.qty + 1 } : i
              )
            };
          }
          return { items: [...state.items, { ...item, qty: 1 }] };
        });
      },

      updateQty: (variantId, qty) => {
        if (qty < 1) return;
        set(state => ({
          items: state.items.map(i => i.variantId === variantId ? { ...i, qty } : i)
        }));
      },

      removeItem: (variantId) => {
        set(state => ({ items: state.items.filter(i => i.variantId !== variantId) }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    {
      name: 'erp-cart', // localStorage key
    }
  )
);
