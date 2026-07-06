import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductVariant } from '@/types';

export interface CartItem {
  variant: ProductVariant;
  qty: number;
  discountPct: number;
}

export interface SuspendedSale {
  id: string;
  date: string;
  cart: CartItem[];
  customerId: string;
  discount: number;
  total: number;
}

interface PosState {
  cart: CartItem[];
  cartDiscountPct: number;
  selectedCustomerId: string;
  
  suspendedSales: SuspendedSale[];
  
  paymentModalOpen: boolean;
  suspendModalOpen: boolean;
  printModalOpen: boolean;
  shiftModalOpen: boolean;
  customerFormOpen: boolean;
  qrModalOpen: boolean;
  qrData: string | null;
  completedOrder: any;
  
  // Actions
  addToCart: (variant: ProductVariant) => void;
  updateQty: (id: string, qty: number) => void;
  updateDiscount: (id: string, pct: number) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;
  
  setCustomerId: (id: string) => void;
  setCartDiscountPct: (pct: number) => void;
  
  suspendSale: (total: number) => void;
  resumeSale: (id: string) => void;
  
  setPaymentModalOpen: (open: boolean) => void;
  setSuspendModalOpen: (open: boolean) => void;
  setPrintModalOpen: (open: boolean) => void;
  setShiftModalOpen: (open: boolean) => void;
  setCustomerFormOpen: (open: boolean) => void;
  setQrModalOpen: (open: boolean, data?: string | null) => void;
  setCompletedOrder: (order: any) => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      cart: [],
      cartDiscountPct: 0,
      selectedCustomerId: '',
      suspendedSales: [],
      
      paymentModalOpen: false,
      suspendModalOpen: false,
      printModalOpen: false,
      shiftModalOpen: false,
      customerFormOpen: false,
      qrModalOpen: false,
      qrData: null,
      completedOrder: null,

      addToCart: (variant) => set((state) => {
        const exists = state.cart.find(i => i.variant.id === variant.id);
        if (exists) {
          return { cart: state.cart.map(i => i.variant.id === variant.id ? { ...i, qty: i.qty + 1 } : i) };
        }
        return { cart: [...state.cart, { variant, qty: 1, discountPct: 0 }] };
      }),

      updateQty: (id, qty) => set((state) => {
        if (qty < 1) {
          return { cart: state.cart.filter(i => i.variant.id !== id) };
        }
        return { cart: state.cart.map(i => i.variant.id === id ? { ...i, qty } : i) };
      }),

      updateDiscount: (id, pct) => set((state) => ({
        cart: state.cart.map(i => i.variant.id === id ? { ...i, discountPct: pct } : i)
      })),

      removeLine: (id) => set((state) => ({
        cart: state.cart.filter(i => i.variant.id !== id)
      })),

      clearCart: () => set({ cart: [], selectedCustomerId: '', cartDiscountPct: 0 }),
      
      setCustomerId: (id) => set({ selectedCustomerId: id }),
      setCartDiscountPct: (pct) => set({ cartDiscountPct: pct }),

      setPaymentModalOpen: (open) => set({ paymentModalOpen: open }),
      setSuspendModalOpen: (open) => set({ suspendModalOpen: open }),
      setPrintModalOpen: (open) => set({ printModalOpen: open }),
      setShiftModalOpen: (open) => set({ shiftModalOpen: open }),
      setCustomerFormOpen: (open) => set({ customerFormOpen: open }),
      setQrModalOpen: (open, data) => set({ qrModalOpen: open, qrData: data || null }),
      setCompletedOrder: (order) => set({ completedOrder: order }),

      suspendSale: (total) => set((state) => {
        if (state.cart.length === 0) return state;
        const newSale: SuspendedSale = {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          cart: state.cart,
          customerId: state.selectedCustomerId,
          discount: state.cartDiscountPct,
          total
        };
        return { 
          suspendedSales: [...state.suspendedSales, newSale],
          cart: [],
          cartDiscountPct: 0,
          selectedCustomerId: '',
        };
      }),

      resumeSale: (id) => set((state) => {
        const sale = state.suspendedSales.find(s => s.id === id);
        if (!sale) return state;
        return {
          cart: sale.cart,
          selectedCustomerId: sale.customerId,
          cartDiscountPct: sale.discount,
          suspendedSales: state.suspendedSales.filter(s => s.id !== id),
          suspendModalOpen: false
        };
      })
    }),
    {
      name: 'vestix_pos_storage',
      partialize: (state) => ({ suspendedSales: state.suspendedSales }),
    }
  )
);
