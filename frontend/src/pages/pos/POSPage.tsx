import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { posApi } from '@/api/pos.api';
import { treasuryApi } from '@/api/treasury.api';
import { queryKeys } from '@/api/queryKeys';
import { useAuthStore } from '@/store/auth.store';

import { usePosStore } from '@/features/pos/store/usePosStore';
import { usePosCheckout } from '@/features/pos/hooks/usePosCheckout';
import { usePosOffline } from '@/features/pos/hooks/usePosOffline';
import { useDexieSync } from '@/hooks/useDexieSync';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import { usePosKeyboard } from '@/features/pos/hooks/usePosKeyboard';

import styles from './POSPage.module.css';
import { POSHeader } from '@/features/pos/components/POSHeader';
import { POSProductGrid } from '@/features/pos/components/POSProductGrid';
import { POSCart } from '@/features/pos/components/POSCart';
import { POSModals } from '@/features/pos/components/POSModals';
import { PosVariantPickerModal } from '@/features/pos/components/PosVariantPickerModal';
import { PosShiftSalesDrawer } from '@/features/pos/components/PosShiftSalesDrawer';

import type { PosPaymentMethodId } from '@/features/pos/constants/posPaymentMethods';
import type { ProductVariant } from '@/types';

export default function POSPage() {
  const { user } = useAuthStore();
  const currentBranchId = user?.branchId || '';
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cart = usePosStore(state => state.cart);
  const cartDiscountPct = usePosStore(state => state.cartDiscountPct);
  const selectedCustomerId = usePosStore(state => state.selectedCustomerId);
  const suspendedSales = usePosStore(state => state.suspendedSales);
  const favoriteVariantIds = usePosStore(state => state.favoriteVariantIds);
  const lastSaleSnapshot = usePosStore(state => state.lastSaleSnapshot);
  const shiftSalesDrawerOpen = usePosStore(state => state.shiftSalesDrawerOpen);
  const setPaymentModalOpen = usePosStore(s => s.setPaymentModalOpen);
  const setQrModalOpen = usePosStore(s => s.setQrModalOpen);
  const setShiftSalesDrawerOpen = usePosStore(s => s.setShiftSalesDrawerOpen);
  const addVariantWithRecent = usePosStore(s => s.addVariantWithRecent);
  const duplicateLastSale = usePosStore(s => s.duplicateLastSale);
  const resumeSale = usePosStore(s => s.resumeSale);

  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethodId>('CASH');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [issueInvoice, setIssueInvoice] = useState(false);
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const [variantPickerOptions, setVariantPickerOptions] = useState<ProductVariant[]>([]);

  const {
    isOnline,
    isCatalogSyncing,
    lastCatalogSync,
    catalogCount,
    forceCatalogSync,
  } = useDexieSync(currentBranchId);

  const { forceSync } = useSyncEngine();
  const queueSyncing = useOfflineQueueStore(s => s.operations.some(o => o.status === 'SYNCING'));
  const isSyncing = isCatalogSyncing || queueSyncing;

  const {
    gridProducts,
    searchResults,
    lookupBarcode,
  } = usePosOffline(currentBranchId, selectedCustomerId, search);

  const { data: activeShift, isLoading: isShiftLoading } = useQuery({
    queryKey: ['shifts', 'active'],
    queryFn: () => treasuryApi.getActiveShift(),
  });

  const { data: registersData } = useQuery({
    queryKey: queryKeys.pos.registers(currentBranchId),
    queryFn: () => posApi.getAvailableRegisters(currentBranchId),
    enabled: !isShiftLoading && !activeShift,
  });

  const { data: cartCalculation } = useQuery({
    queryKey: ['pos', 'calculate', cart, cartDiscountPct, selectedCustomerId],
    queryFn: () => posApi.calculateCart({
      lines: cart.map(i => ({
        variantId: i.variant.id,
        quantity: i.qty,
        discountPct: i.discountPct,
      })),
      cartDiscountPct,
      customerId: selectedCustomerId || undefined,
    }),
    enabled: cart.length > 0 && isOnline,
    staleTime: 5_000,
  });

  useEffect(() => {
    const loadCartId = (location.state as { loadCartId?: string } | null)?.loadCartId;
    if (!loadCartId) return;

    const suspended = suspendedSales.find(s => s.id === loadCartId);
    if (suspended) {
      resumeSale(suspended.id);
      toast.success('Venta suspendida retomada');
    } else {
      lookupBarcode(loadCartId)
        .then(results => {
          if (results?.length === 1) {
            addVariantWithRecent(results[0]);
            toast.success('Producto agregado al carrito');
          } else if (results && results.length > 1) {
            setVariantPickerOptions(results);
            setVariantPickerOpen(true);
          } else {
            toast.error('No se encontró el producto o venta');
          }
        })
        .catch(() => toast.error('Error al cargar desde escáner'));
    }

    navigate('/pos', { replace: true, state: {} });
  }, [location.state]);

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const clientSubtotal = cart.reduce((acc, item) => acc + (item.variant.basePrice * item.qty), 0);
  const clientLineDiscounts = cart.reduce((acc, item) => acc + ((item.variant.basePrice * item.qty) * (item.discountPct / 100)), 0);
  const clientTotalAfterLines = clientSubtotal - clientLineDiscounts;
  const clientGlobalDiscount = clientTotalAfterLines * (cartDiscountPct / 100);

  const subtotal = cartCalculation?.subtotal ?? clientSubtotal;
  const lineDiscounts = cartCalculation?.lineDiscountsTotal ?? clientLineDiscounts;
  const globalDiscount = cartCalculation
    ? Math.max(0, (cartCalculation.cartDiscountTotal || 0) - lineDiscounts)
    : clientGlobalDiscount;
  const grandTotal = cartCalculation?.grandTotal ?? (clientTotalAfterLines - clientGlobalDiscount);
  const appliedPromotions = cartCalculation?.appliedPromotions;

  const checkoutMutation = usePosCheckout(activeShift, currentBranchId);

  const handleCheckoutPayment = useCallback(async (method: PosPaymentMethodId) => {
    if (cart.length === 0) return;
    setPaymentMethod(method);
    usePosStore.getState().setPaymentSplits([]);
    usePosStore.getState().setPaymentReference('');

    if (method === 'QR_MERCADOPAGO') {
      if (!isOnline) {
        toast.error('QR Mercado Pago requiere conexión a internet');
        return;
      }
      setQrModalOpen(true);
      setIsGeneratingQr(true);
      try {
        const res = await posApi.generateQrOrder(grandTotal, 'Cobro Vestix POS');
        usePosStore.getState().setQrModalOpen(true, res.qrData, res.orderId);
      } catch {
        toast.error('Error al generar QR de cobro');
        usePosStore.getState().setQrModalOpen(true, null);
      } finally {
        setIsGeneratingQr(false);
      }
    } else if (method === 'MULTIPLE') {
      usePosStore.getState().setMixedPaymentModalOpen(true);
    } else {
      setPaymentModalOpen(true);
    }
  }, [cart.length, grandTotal, isOnline, setPaymentModalOpen, setQrModalOpen]);

  const handleSearchEnter = useCallback(() => {
    if (!searchResults || searchResults.length === 0) return;
    if (searchResults.length === 1) {
      addVariantWithRecent(searchResults[0]);
      setSearch('');
      toast.success('Producto agregado');
    } else {
      setVariantPickerOptions(searchResults);
      setVariantPickerOpen(true);
    }
  }, [searchResults, addVariantWithRecent]);

  const handleFavoriteSlot = useCallback((index: number) => {
    const variantId = favoriteVariantIds[index];
    if (!variantId || !gridProducts) return;
    const variant = gridProducts.find(p => p.id === variantId);
    if (variant) {
      addVariantWithRecent(variant);
      toast.success('Favorito agregado');
    }
  }, [favoriteVariantIds, gridProducts, addVariantWithRecent]);

  const handleDuplicateLastSale = useCallback(() => {
    if (duplicateLastSale()) {
      toast.success('Última venta duplicada en el carrito');
    } else {
      toast.error('No hay venta anterior para duplicar');
    }
  }, [duplicateLastSale]);

  usePosKeyboard({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onQuickCash: () => {
      if (cart.length > 0) handleCheckoutPayment('CASH');
    },
    onDuplicateLastSale: handleDuplicateLastSale,
    onFavoriteSlot: handleFavoriteSlot,
    onEscape: () => setSearch(''),
  });

  const handleConfirmCheckout = (status: 'CONFIRMED' | 'QUOTATION') => {
    checkoutMutation.mutate({
      status,
      grandTotal,
      subtotal,
      paymentMethod,
      issueInvoice,
    });
  };

  if (isShiftLoading) {
    return <div className={styles.loadingState}>Cargando estado de caja...</div>;
  }

  return (
    <div className={styles.layout}>
      <POSHeader
        branchId={currentBranchId}
        isOnline={isOnline}
        isSyncing={isSyncing}
        lastCatalogSync={lastCatalogSync}
        catalogCount={catalogCount}
        onForceSync={forceSync}
        onForceCatalogSync={forceCatalogSync}
        search={search}
        setSearch={setSearch}
        searchInputRef={searchInputRef}
        onSearchEnter={handleSearchEnter}
        onDuplicateLastSale={handleDuplicateLastSale}
        hasLastSale={!!lastSaleSnapshot?.cart.length}
      />

      <div className={styles.main}>
        <POSProductGrid
          products={gridProducts}
          searchResults={searchResults}
          search={search}
        />

        <POSCart
          subtotal={subtotal}
          grandTotal={grandTotal}
          lineDiscounts={lineDiscounts}
          globalDiscount={globalDiscount}
          totalItems={totalItems}
          isOffline={!isOnline}
          catalogCount={catalogCount}
          appliedPromotions={appliedPromotions}
          onCheckoutQuotation={() => handleConfirmCheckout('QUOTATION')}
          onCheckoutPayment={handleCheckoutPayment}
        />
      </div>

      <POSModals
        grandTotal={grandTotal}
        paymentMethod={paymentMethod}
        isGeneratingQr={isGeneratingQr}
        onConfirmCheckout={handleConfirmCheckout}
        isCheckoutLoading={checkoutMutation.isPending}
        activeShift={activeShift}
        registersData={registersData}
        isShiftLoading={isShiftLoading}
        issueInvoice={issueInvoice}
        setIssueInvoice={setIssueInvoice}
      />

      <PosVariantPickerModal
        open={variantPickerOpen}
        variants={variantPickerOptions}
        onSelect={v => { addVariantWithRecent(v); setSearch(''); }}
        onClose={() => setVariantPickerOpen(false)}
      />

      <PosShiftSalesDrawer
        open={shiftSalesDrawerOpen}
        shiftId={activeShift?.id}
        onClose={() => setShiftSalesDrawerOpen(false)}
      />
    </div>
  );
}
