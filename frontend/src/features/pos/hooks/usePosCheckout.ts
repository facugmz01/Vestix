import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/api/sales.api';
import { db } from '@/core/db/db';
import { usePosStore } from '../store/usePosStore';
import toast from 'react-hot-toast';
import { get } from '@/api/client';

export function usePosCheckout(activeShift: any, currentBranchId: string) {
  const queryClient = useQueryClient();
  const clearCart = usePosStore(state => state.clearCart);

  return useMutation({
    mutationFn: async ({ status, grandTotal, subtotal, paymentMethod, issueInvoice }: any) => {
      if (!activeShift) throw new Error('No hay sesión de caja activa');
      
      const { cart, selectedCustomerId } = usePosStore.getState();
      const orderId = crypto.randomUUID();

      let warehouseId = 'main';
      try {
        const warehouses = await queryClient.fetchQuery({
          queryKey: ['warehouses', currentBranchId],
          queryFn: () => get<any[]>('/inventory/warehouses', { params: { branchId: currentBranchId } }),
          staleTime: 600_000,
        });
        warehouseId = warehouses?.[0]?.id || 'main';
      } catch { warehouseId = 'main'; }

      let paymentAccountId: string | undefined;
      try {
        const accounts = await queryClient.fetchQuery({
          queryKey: ['accounts', currentBranchId],
          queryFn: () => get<any[]>('/finance/accounts', { params: { branchId: currentBranchId } }),
          staleTime: 600_000,
        });
        paymentAccountId = accounts?.find((a: any) => a.isActive)?.id;
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
          categoryId: (i.variant as any).product?.categoryId || 'default',
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
        const res = await salesApi.createSale(dto as any);
        return { offline: false, res, dto };
      } catch (err: any) {
        if (!err.response || err.code === 'ERR_NETWORK') {
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
      // Snapshot cart state for optimistic updates
      const prevCart = usePosStore.getState().cart;
      // Optimistic cart clear
      clearCart();
      return { prevCart };
    },
    onSuccess: (data) => {
      if (data.offline) {
        toast('Venta guardada offline. Se sincronizará pronto.', { icon: '🔄' });
      } else {
        toast.success('Venta registrada con éxito');
      }
      
      // Abre el modal de imprimir
      usePosStore.getState().setCompletedOrder(data.res || data.dto);
      usePosStore.getState().setPrintModalOpen(true);
      usePosStore.getState().setPaymentModalOpen(false);
    },
    onError: (err, variables, context) => {
      // Revertir estado si falló y no se fue a Dexie
      if (context?.prevCart) {
        usePosStore.setState({ cart: context.prevCart });
      }
      toast.error('Error al registrar la venta.');
    }
  });
}
