import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/api/sales.api';
import { db } from '@/core/db/db';
import { usePosStore } from '../store/usePosStore';
import toast from 'react-hot-toast';
import { get } from '@/api/client';
import type { SaleOrder, PaymentMethod } from '@/types';

function buildOfflineReceipt(dto: Record<string, any>): SaleOrder {
  const lines = (dto.lines || []).map((line: any, idx: number) => ({
    id: `offline-${idx}`,
    variantId: line.variantId,
    quantity: line.quantity,
    basePrice: line.unitPriceOverride || 0,
    discountAmount: (line.unitPriceOverride || 0) * line.quantity * ((line.discountPct || 0) / 100),
    finalPrice: (line.unitPriceOverride || 0) * line.quantity * (1 - (line.discountPct || 0) / 100),
  }));

  const subtotal = lines.reduce((acc, l) => acc + l.basePrice * l.quantity, 0);
  const grandTotal = dto.posGrandTotal ?? subtotal;

  return {
    id: dto.id,
    branchId: dto.branchId,
    source: 'POS',
    status: dto.status === 'QUOTE' ? 'QUOTATION' : 'CONFIRMED',
    customerId: dto.customerId,
    lines,
    subtotal,
    cartDiscountTotal: dto.cartDiscountTotal || Math.max(0, subtotal - grandTotal),
    grandTotal,
    paymentMethod: (dto.paymentMethod || 'CASH') as PaymentMethod,
    createdAt: dto.createdAtIso || new Date().toISOString(),
  };
}

export function usePosCheckout(activeShift: { id: string } | null | undefined, currentBranchId: string) {
  const queryClient = useQueryClient();
  const clearCart = usePosStore(state => state.clearCart);

  return useMutation({
    mutationFn: async ({ status, grandTotal, subtotal, paymentMethod, issueInvoice }: {
      status: 'CONFIRMED' | 'QUOTATION';
      grandTotal: number;
      subtotal: number;
      paymentMethod: string;
      issueInvoice: boolean;
    }) => {
      if (!activeShift) throw new Error('No hay sesión de caja activa');
      
      const { cart, selectedCustomerId } = usePosStore.getState();
      const orderId = crypto.randomUUID();

      let warehouseId = 'main';
      try {
        const warehouses = await queryClient.fetchQuery({
          queryKey: ['warehouses', currentBranchId],
          queryFn: () => get<{ id: string }[]>('/inventory/warehouses', { params: { branchId: currentBranchId } }),
          staleTime: 600_000,
        });
        warehouseId = warehouses?.[0]?.id || 'main';
      } catch { warehouseId = 'main'; }

      let paymentAccountId: string | undefined;
      try {
        const accounts = await queryClient.fetchQuery({
          queryKey: ['accounts', currentBranchId],
          queryFn: () => get<{ id: string; isActive?: boolean }[]>('/finance/accounts', { params: { branchId: currentBranchId } }),
          staleTime: 600_000,
        });
        paymentAccountId = accounts?.find(a => a.isActive)?.id;
      } catch { paymentAccountId = undefined; }

      const dto = {
        id: orderId,
        branchId: currentBranchId,
        warehouseId,
        customerId: selectedCustomerId || undefined,
        source: 'POS',
        paymentMethod: paymentMethod === 'MULTIPLE' ? 'CASH' : (paymentMethod === 'QR_MERCADOPAGO' ? 'CREDIT_CARD' : paymentMethod),
        paymentAccountId,
        cashShiftId: activeShift.id,
        status: status === 'QUOTATION' ? 'QUOTE' : 'COMPLETED',
        posGrandTotal: grandTotal,
        cartDiscountTotal: grandTotal < subtotal ? subtotal - grandTotal : 0,
        createdAtIso: new Date().toISOString(),
        lines: cart.map(i => ({
          variantId: i.variant.id,
          categoryId: (i.variant as { product?: { categoryId?: string } }).product?.categoryId || 'default',
          quantity: i.qty,
          unitPriceOverride: i.variant.basePrice,
          discountPct: i.discountPct,
        })),
        issueInvoice,
      };

      if (!navigator.onLine) {
        await db.syncQueue.add({
          type: 'SALE',
          payload: dto,
          createdAt: new Date().toISOString(),
          status: 'PENDING',
          retryCount: 0,
        });
        return { offline: true, dto };
      }

      try {
        const res = await salesApi.createSale(dto);
        return { offline: false, res, dto };
      } catch (err: unknown) {
        const axiosErr = err as { response?: unknown; code?: string };
        if (!axiosErr.response || axiosErr.code === 'ERR_NETWORK') {
          await db.syncQueue.add({
            type: 'SALE',
            payload: dto,
            createdAt: new Date().toISOString(),
            status: 'PENDING',
            retryCount: 0,
          });
          return { offline: true, dto };
        }
        throw err;
      }
    },
    onMutate: () => {
      const prevCart = usePosStore.getState().cart;
      clearCart();
      return { prevCart };
    },
    onSuccess: (data) => {
      if (data.offline) {
        toast('Venta guardada offline. Se sincronizará pronto.', { icon: '🔄' });
      } else {
        toast.success('Venta registrada con éxito');
      }
      
      const order = data.offline
        ? buildOfflineReceipt(data.dto)
        : (data.res as SaleOrder);
      usePosStore.getState().setCompletedOrder(order);
      usePosStore.getState().setPrintModalOpen(true);
      usePosStore.getState().setPaymentModalOpen(false);
    },
    onError: (_err, _variables, context) => {
      if (context?.prevCart) {
        usePosStore.setState({ cart: context.prevCart });
      }
      toast.error('Error al registrar la venta.');
    }
  });
}
