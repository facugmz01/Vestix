import { create } from 'zustand';
import type { CartLine } from '@/types';

interface PosState {
  lines: CartLine[];
  customerId: string | null;
  addLine: (line: CartLine) => void;
  updateQty: (variantId: string, qty: number) => void;
  removeLine: (variantId: string) => void;
  setCustomer: (id: string | null) => void;
  clearCart: () => void;
  grandTotal: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  lines: [],
  customerId: null,

  addLine: (line) => {
    const existing = get().lines.find((l) => l.variantId === line.variantId);
    if (existing) {
      set((s) => ({ lines: s.lines.map((l) => l.variantId === line.variantId ? { ...l, quantity: l.quantity + line.quantity } : l) }));
    } else {
      set((s) => ({ lines: [...s.lines, line] }));
    }
  },

  updateQty: (variantId, qty) => {
    if (qty <= 0) { get().removeLine(variantId); return; }
    set((s) => ({ lines: s.lines.map((l) => l.variantId === variantId ? { ...l, quantity: qty } : l) }));
  },

  removeLine: (variantId) =>
    set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),

  setCustomer: (id) => set({ customerId: id }),
  clearCart: () => set({ lines: [], customerId: null }),

  grandTotal: () =>
    get().lines.reduce((sum, l) => sum + l.basePrice * l.quantity, 0),
}));
