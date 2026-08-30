import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateUUID } from '@/utils/generateUUID';
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

export interface LastSaleSnapshot {
  cart: CartItem[];
  customerId: string;
  cartDiscountPct: number;
}

interface PosState {
  cart: CartItem[];
  cartDiscountPct: number;
  selectedCustomerId: string;

  suspendedSales: SuspendedSale[];
  favoriteVariantIds: string[];
  recentVariantIds: string[];
  lastSaleSnapshot: LastSaleSnapshot | null;

  paymentModalOpen: boolean;
  suspendModalOpen: boolean;
  printModalOpen: boolean;
  shiftModalOpen: boolean;
  shiftSalesDrawerOpen: boolean;
  syncPanelOpen: boolean;
  customerFormOpen: boolean;
  qrModalOpen: boolean;
  qrData: string | null;
  qrOrderId: string | null;
  mixedPaymentModalOpen: boolean;
  paymentReference: string;
  paymentSplits: { method: string; amount: number; reference?: string }[];
  giftCardCode: string;
  giftCardAmount: number;
  loyaltyPointsToRedeem: number;
  completedOrder: any;

  addToCart: (variant: ProductVariant) => void;
  addVariantWithRecent: (variant: ProductVariant) => void;
  updateQty: (id: string, qty: number) => void;
  updateDiscount: (id: string, pct: number) => void;
  removeLine: (id: string) => void;
  clearCart: () => void;

  setCustomerId: (id: string) => void;
  setCartDiscountPct: (pct: number) => void;

  toggleFavorite: (variantId: string) => void;
  recordRecentVariant: (variantId: string) => void;
  saveLastSaleSnapshot: () => void;
  duplicateLastSale: () => boolean;

  suspendSale: (total: number) => void;
  resumeSale: (id: string) => void;

  setPaymentModalOpen: (open: boolean) => void;
  setSuspendModalOpen: (open: boolean) => void;
  setPrintModalOpen: (open: boolean) => void;
  setShiftModalOpen: (open: boolean) => void;
  setShiftSalesDrawerOpen: (open: boolean) => void;
  setSyncPanelOpen: (open: boolean) => void;
  setCustomerFormOpen: (open: boolean) => void;
  setQrModalOpen: (open: boolean, data?: string | null, orderId?: string | null) => void;
  setMixedPaymentModalOpen: (open: boolean) => void;
  setPaymentReference: (ref: string) => void;
  setPaymentSplits: (splits: { method: string; amount: number; reference?: string }[]) => void;
  setGiftCardCode: (code: string) => void;
  setGiftCardAmount: (amount: number) => void;
  setLoyaltyPointsToRedeem: (points: number) => void;
  clearGiftCardRedemption: () => void;
  clearLoyaltyRedemption: () => void;
  setCompletedOrder: (order: any) => void;
}

const MAX_FAVORITES = 8;
const MAX_RECENT = 12;

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      cart: [],
      cartDiscountPct: 0,
      selectedCustomerId: '',
      suspendedSales: [],
      favoriteVariantIds: [],
      recentVariantIds: [],
      lastSaleSnapshot: null,

      paymentModalOpen: false,
      suspendModalOpen: false,
      printModalOpen: false,
      shiftModalOpen: false,
      shiftSalesDrawerOpen: false,
      syncPanelOpen: false,
      customerFormOpen: false,
      qrModalOpen: false,
      qrData: null,
      qrOrderId: null,
      mixedPaymentModalOpen: false,
      paymentReference: '',
      paymentSplits: [],
      giftCardCode: '',
      giftCardAmount: 0,
      loyaltyPointsToRedeem: 0,
      completedOrder: null,

      addToCart: (variant) => set((state) => {
        const exists = state.cart.find(i => i.variant.id === variant.id);
        if (exists) {
          return { cart: state.cart.map(i => i.variant.id === variant.id ? { ...i, qty: i.qty + 1 } : i) };
        }
        return { cart: [...state.cart, { variant, qty: 1, discountPct: 0 }] };
      }),

      addVariantWithRecent: (variant) => {
        get().recordRecentVariant(variant.id);
        get().addToCart(variant);
      },

      updateQty: (id, qty) => set((state) => {
        if (qty < 1) {
          return { cart: state.cart.filter(i => i.variant.id !== id) };
        }
        return { cart: state.cart.map(i => i.variant.id === id ? { ...i, qty } : i) };
      }),

      updateDiscount: (id, pct) => set((state) => ({
        cart: state.cart.map(i => i.variant.id === id ? { ...i, discountPct: pct } : i),
      })),

      removeLine: (id) => set((state) => ({
        cart: state.cart.filter(i => i.variant.id !== id),
      })),

      clearCart: () => set({
        cart: [],
        selectedCustomerId: '',
        cartDiscountPct: 0,
        paymentReference: '',
        paymentSplits: [],
        giftCardCode: '',
        giftCardAmount: 0,
        loyaltyPointsToRedeem: 0,
      }),

      setCustomerId: (id) => set({
        selectedCustomerId: id,
        loyaltyPointsToRedeem: 0,
      }),
      setCartDiscountPct: (pct) => set({ cartDiscountPct: pct }),

      toggleFavorite: (variantId) => set((state) => {
        const exists = state.favoriteVariantIds.includes(variantId);
        if (exists) {
          return { favoriteVariantIds: state.favoriteVariantIds.filter(id => id !== variantId) };
        }
        const next = [variantId, ...state.favoriteVariantIds.filter(id => id !== variantId)];
        return { favoriteVariantIds: next.slice(0, MAX_FAVORITES) };
      }),

      recordRecentVariant: (variantId) => set((state) => {
        const next = [variantId, ...state.recentVariantIds.filter(id => id !== variantId)];
        return { recentVariantIds: next.slice(0, MAX_RECENT) };
      }),

      saveLastSaleSnapshot: () => set((state) => {
        if (state.cart.length === 0) return state;
        return {
          lastSaleSnapshot: {
            cart: state.cart.map(i => ({ ...i, variant: { ...i.variant } })),
            customerId: state.selectedCustomerId,
            cartDiscountPct: state.cartDiscountPct,
          },
        };
      }),

      duplicateLastSale: () => {
        const snap = get().lastSaleSnapshot;
        if (!snap || snap.cart.length === 0) return false;
        set({
          cart: snap.cart.map(i => ({ ...i, variant: { ...i.variant } })),
          selectedCustomerId: snap.customerId,
          cartDiscountPct: snap.cartDiscountPct,
        });
        return true;
      },

      setPaymentModalOpen: (open) => set({ paymentModalOpen: open }),
      setSuspendModalOpen: (open) => set({ suspendModalOpen: open }),
      setPrintModalOpen: (open) => set({ printModalOpen: open }),
      setShiftModalOpen: (open) => set({ shiftModalOpen: open }),
      setShiftSalesDrawerOpen: (open) => set({ shiftSalesDrawerOpen: open }),
      setSyncPanelOpen: (open) => set({ syncPanelOpen: open }),
      setCustomerFormOpen: (open) => set({ customerFormOpen: open }),
      setQrModalOpen: (open, data, orderId) => set({
        qrModalOpen: open,
        qrData: data ?? null,
        qrOrderId: orderId ?? null,
      }),
      setMixedPaymentModalOpen: (open) => set({ mixedPaymentModalOpen: open }),
      setPaymentReference: (ref) => set({ paymentReference: ref }),
      setPaymentSplits: (splits) => set({ paymentSplits: splits }),
      setGiftCardCode: (code) => set({ giftCardCode: code }),
      setGiftCardAmount: (amount) => set({ giftCardAmount: amount }),
      setLoyaltyPointsToRedeem: (points) => set({ loyaltyPointsToRedeem: points }),
      clearGiftCardRedemption: () => set({ giftCardCode: '', giftCardAmount: 0 }),
      clearLoyaltyRedemption: () => set({ loyaltyPointsToRedeem: 0 }),
      setCompletedOrder: (order) => set({ completedOrder: order }),

      suspendSale: (total) => set((state) => {
        if (state.cart.length === 0) return state;
        const newSale: SuspendedSale = {
          id: generateUUID(),
          date: new Date().toISOString(),
          cart: state.cart,
          customerId: state.selectedCustomerId,
          discount: state.cartDiscountPct,
          total,
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
          suspendModalOpen: false,
        };
      }),
    }),
    {
      name: 'vestix_pos_storage',
      partialize: (state) => ({
        suspendedSales: state.suspendedSales,
        cart: state.cart,
        cartDiscountPct: state.cartDiscountPct,
        selectedCustomerId: state.selectedCustomerId,
        favoriteVariantIds: state.favoriteVariantIds,
        recentVariantIds: state.recentVariantIds,
        lastSaleSnapshot: state.lastSaleSnapshot,
      }),
    },
  ),
);
