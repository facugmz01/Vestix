import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/api/sales.api';
import { queryKeys } from '@/api/queryKeys';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import { usePosStore } from '../store/usePosStore';
import toast from 'react-hot-toast';
import { get } from '@/api/client';
import { warehousesApi } from '@/api/warehouses.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { generateUUID } from '@/utils/generateUUID';
import type { SaleOrder, PaymentMethod, ProductVariant } from '@/types';

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
    mutationFn: async ({
      status,
      grandTotal,
      amountDue,
      subtotal,
      cartDiscountTotal,
      paymentMethod,
      issueInvoice,
      invoiceType,
      fiscalCustomerData,
    }: {
      status: 'CONFIRMED' | 'QUOTATION';
      grandTotal: number;
      amountDue: number;
      subtotal: number;
      /** Manual cart-level discount only (excludes line discounts and promotions). */
      cartDiscountTotal?: number;
      paymentMethod: string;
      issueInvoice: boolean;
      invoiceType?: string;
      fiscalCustomerData?: {
        taxId?: string;
        docType?: 'CUIT' | 'CUIL' | 'DNI';
        businessName?: string;
        taxCondition?: string;
        fiscalAddress?: string;
      };
    }) => {
      if (!activeShift) throw new Error('No hay sesión de caja activa');
      if (!currentBranchId) {
        throw new Error('Tu usuario no tiene sucursal asignada. Asigná una sucursal antes de vender.');
      }

      const {
        cart,
        selectedCustomerId,
        paymentReference,
        paymentSplits,
        qrOrderId,
        giftCardCode,
        giftCardAmount,
        loyaltyPointsToRedeem,
      } = usePosStore.getState();

      if (!cart.length) {
        throw new Error('El carrito está vacío');
      }

      const orderId = generateUUID();

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

      const resolvedMethod = paymentSplits.length > 0
        ? 'MULTIPLE'
        : amountDue <= 0.01
          ? 'GIFT_CARD'
          : paymentMethod;

      const dto: Record<string, unknown> = {
        id: orderId,
        branchId: currentBranchId,
        warehouseId,
        customerId: selectedCustomerId || undefined,
        source: 'POS',
        paymentMethod: resolvedMethod,
        paymentAccountId: undefined,
        paymentReference: resolvedPaymentReference,
        payments: paymentSplits.length > 0 ? paymentSplits : undefined,
        cashShiftId: activeShift.id,
        status: status === 'QUOTATION' ? 'QUOTE' : 'COMPLETED',
        posGrandTotal: amountDue,
        cartDiscountTotal: Math.max(0, cartDiscountTotal ?? 0),
        globalDiscountType: usePosStore.getState().globalDiscountType,
        globalDiscountValue: usePosStore.getState().globalDiscountValue,
        supervisorApprovalToken: usePosStore.getState().globalSupervisorToken,
        createdAtIso: new Date().toISOString(),
        lines: cart.map(i => {
          const variant = i.variant as ProductVariant & {
            categoryId?: string;
            product?: { categoryId?: string };
          };
          // Prefer real category IDs; never send a fake "default" — that blocks
          // category promotions on the server and causes Payment mismatch.
          const categoryId = variant.categoryId || variant.product?.categoryId;
          return {
            variantId: variant.id,
            ...(categoryId ? { categoryId } : {}),
            quantity: i.qty,
            unitPriceOverride: i.customUnitPrice ?? variant.basePrice,
            customUnitPrice: i.customUnitPrice,
            discountType: i.discountType,
            discountValue: i.discountValue,
            discountPct: i.discountPct,
            supervisorApprovalToken: i.supervisorApprovalToken,
          };
        }),
        issueInvoice,
        emitInvoice: issueInvoice,
        invoiceType: issueInvoice ? (invoiceType || 'FACTURA_B') : undefined,
        fiscalCustomerData: issueInvoice ? fiscalCustomerData : undefined,
      };

      if (status !== 'QUOTATION' && giftCardAmount > 0 && giftCardCode) {
        dto.giftCardRedemption = { code: giftCardCode, amount: giftCardAmount };
      }
      if (status !== 'QUOTATION' && loyaltyPointsToRedeem > 0 && selectedCustomerId) {
        dto.loyaltyRedemption = { points: loyaltyPointsToRedeem };
      }

      const enqueueSale = () => {
        useOfflineQueueStore.getState().enqueue({
          module: 'POS',
          action: 'createSale',
          description: `Venta POS offline por ${formatCurrency(amountDue)}`,
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
        // apiClient normalizes HTTP errors to { status, message } (no .response).
        // status:number → real HTTP error (do not fake offline)
        // status:null   → transport failure / no response
        const apiErr = err as { status?: number | null; code?: string };
        const isHttpError = typeof apiErr.status === 'number';
        const isTransportFailure = apiErr.status === null || apiErr.code === 'ERR_NETWORK';
        if (!isHttpError && isTransportFailure) {
          enqueueSale();
          return { offline: true, dto };
        }
        throw err;
      }
    },
    // Do NOT clear the cart here — TanStack calls onMutate before mutationFn, so
    // clearing would send lines:[] and cause "Payment mismatch. Expected 0 …".
    onMutate: () => {
      usePosStore.getState().saveLastSaleSnapshot();
    },
    onSuccess: (data) => {
      clearCart();

      if (data.offline) {
        toast('Venta guardada offline. Se sincronizará pronto.', { icon: '🔄' });
      } else {
        toast.success('Venta registrada con éxito');
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.currentAccounts() });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });

      const order = data.offline
        ? buildOfflineReceipt(data.dto)
        : (data.res as SaleOrder);
      usePosStore.getState().setCompletedOrder(order);
      usePosStore.getState().setPrintModalOpen(true);
      usePosStore.getState().setPaymentModalOpen(false);
      usePosStore.getState().setMixedPaymentModalOpen(false);
      usePosStore.getState().setQrModalOpen(false);
    },
    onError: (err) => {
      const apiErr = err as { message?: string; status?: number | null };
      // Axios interceptor already toasts HTTP 400/403/5xx; only cover gaps here.
      if (apiErr?.status == null || apiErr.status === 404) {
        toast.error(apiErr?.message || 'Error al registrar la venta.');
      }
    }
  });
}
