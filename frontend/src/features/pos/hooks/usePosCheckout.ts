import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/api/sales.api';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import { usePosStore } from '../store/usePosStore';
import toast from 'react-hot-toast';
import { get } from '@/api/client';
import { warehousesApi } from '@/api/warehouses.api';
import { formatCurrency } from '@/utils/formatCurrency';
import type { SaleOrder, PaymentMethod } from '@/types';

function buildOfflineReceipt(dto: Record<string, unknown>): SaleOrder {
  const lines = ((dto.lines as unknown[]) || []).map((line: unknown, idx: number) => {
    const l = line as { variantId: string; quantity: number; unitPriceOverride?: number; discountPct?: number };
    return {
      id: `offline-${idx}`,
      variantId: l.variantId,
      quantity: l.quantity,
      basePrice: l.unitPriceOverride || 0,
      discountAmount: (l.unitPriceOverride || 0) * l.quantity * ((l.discountPct || 0) / 100),
      finalPrice: (l.unitPriceOverride || 0) * l.quantity * (1 - (l.discountPct || 0) / 100),
    };
  });

  const subtotal = lines.reduce((acc, l) => acc + l.basePrice * l.quantity, 0);
  const grandTotal = (dto.posGrandTotal as number) ?? subtotal;

  return {
    id: dto.id as string,
    branchId: dto.branchId as string,
    source: 'POS',
    status: dto.status === 'QUOTE' ? 'QUOTATION' : 'CONFIRMED',
    customerId: dto.customerId as string | undefined,
    lines,
    subtotal,
    cartDiscountTotal: (dto.cartDiscountTotal as number) || Math.max(0, subtotal - grandTotal),
    grandTotal,
    paymentMethod: (dto.paymentMethod || 'CASH') as PaymentMethod,
    createdAt: (dto.createdAtIso as string) || new Date().toISOString(),
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

      const { cart, selectedCustomerId, paymentReference, paymentSplits, qrOrderId } = usePosStore.getState();
      const orderId = crypto.randomUUID();

      let resolvedPaymentReference = paymentReference || undefined;
      if (paymentMethod === 'QR_MERCADOPAGO' && qrOrderId) {
        resolvedPaymentReference = qrOrderId;
      }

      const warehousesRes = await queryClient.fetchQuery({
        queryKey: ['warehouses', currentBranchId],
        queryFn: () => warehousesApi.getWarehouses({ branchId: currentBranchId, pageSize: 50 }),
        staleTime: 600_000,
      });
      const warehouseId = warehousesRes.data?.[0]?.id;
      if (!warehouseId) {
        throw new Error('No hay depósito configurado para esta sucursal');
      }

      let paymentAccountId: string | undefined;
      try {
        const accounts = await queryClient.fetchQuery({
          queryKey: ['treasury-accounts', currentBranchId],
          queryFn: () => get<{ id: string; isActive?: boolean; branchId?: string }[]>('/finance/treasury/accounts'),
          staleTime: 600_000,
        });
        paymentAccountId = accounts?.find(a => a.isActive && (!a.branchId || a.branchId === currentBranchId))?.id;
      } catch {
        paymentAccountId = undefined;
      }

      const resolvedMethod = paymentSplits.length > 0 ? 'MULTIPLE' : paymentMethod;

      const dto: Record<string, unknown> = {
        id: orderId,
        branchId: currentBranchId,
        warehouseId,
        customerId: selectedCustomerId || undefined,
        source: 'POS',
        paymentMethod: resolvedMethod,
        paymentAccountId: resolvedMethod === 'CUSTOMER_CREDIT' ? undefined : paymentAccountId,
        paymentReference: resolvedPaymentReference,
        payments: paymentSplits.length > 0 ? paymentSplits : undefined,
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

      const enqueueSale = () => {
        useOfflineQueueStore.getState().enqueue({
          module: 'POS',
          action: 'createSale',
          description: `Venta POS offline por ${formatCurrency(grandTotal)}`,
          endpoint: '/sales/checkout',
          method: 'POST',
          maxRetries: 5,
          payload: dto,
        });
      };

      if (!navigator.onLine) {
        enqueueSale();
        return { offline: true, dto };
      }

      try {
        const res = await salesApi.createSale(dto as Parameters<typeof salesApi.createSale>[0]);
        return { offline: false, res: res.order || res, dto };
      } catch (err: unknown) {
        const axiosErr = err as { response?: unknown; code?: string };
        if (!axiosErr.response || axiosErr.code === 'ERR_NETWORK') {
          enqueueSale();
          return { offline: true, dto };
        }
        throw err;
      }
    },
    onMutate: () => {
      const prevCart = usePosStore.getState().cart;
      usePosStore.getState().saveLastSaleSnapshot();
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
      usePosStore.getState().setMixedPaymentModalOpen(false);
      usePosStore.getState().setQrModalOpen(false);
    },
    onError: (_err, _variables, context) => {
      if (context?.prevCart) {
        usePosStore.setState({ cart: context.prevCart });
      }
      toast.error('Error al registrar la venta.');
    }
  });
}
