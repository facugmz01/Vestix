import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { posApi } from '@/api/pos.api';
import { customersApi } from '@/api/customers.api';
import { treasuryApi } from '@/api/treasury.api';
import { queryKeys } from '@/api/queryKeys';
import { useAuthStore } from '@/store/auth.store';

import { usePosStore } from '@/features/pos/store/usePosStore';
import { usePosCheckout } from '@/features/pos/hooks/usePosCheckout';
import { usePosOffline } from '@/features/pos/hooks/usePosOffline';
import { useDexieSync } from '@/hooks/useDexieSync';

import { POSHeader } from '@/features/pos/components/POSHeader';
import { POSProductGrid } from '@/features/pos/components/POSProductGrid';
import { POSCart } from '@/features/pos/components/POSCart';
import { POSModals } from '@/features/pos/components/POSModals';

import type { PosPaymentMethodId } from '@/features/pos/constants/posPaymentMethods';

import styles from './POSPage.module.css';

export default function POSPage() {
  const { user } = useAuthStore();
  const currentBranchId = user?.branchId || '';
  const location = useLocation();
  const navigate = useNavigate();

  const cart = usePosStore(state => state.cart);
  const cartDiscountPct = usePosStore(state => state.cartDiscountPct);
  const selectedCustomerId = usePosStore(state => state.selectedCustomerId);
  const suspendedSales = usePosStore(state => state.suspendedSales);
  const setPaymentModalOpen = usePosStore(s => s.setPaymentModalOpen);
  const setQrModalOpen = usePosStore(s => s.setQrModalOpen);
  const addToCart = usePosStore(s => s.addToCart);
  const resumeSale = usePosStore(s => s.resumeSale);
  
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PosPaymentMethodId>('CASH');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [issueInvoice, setIssueInvoice] = useState(false);

  const {
    isOnline,
    isSyncing,
    lastCatalogSync,
    catalogCount,
    forceSync,
    forceCatalogSync,
  } = useDexieSync(currentBranchId);

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

  const { data: customersData } = useQuery({
    queryKey: queryKeys.customers.all(),
    queryFn: () => customersApi.getCustomers({ pageSize: 1000 }),
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
            addToCart(results[0]);
            toast.success('Producto agregado al carrito');
          } else if (results && results.length > 1) {
            setSearch(loadCartId);
            toast('Varios productos encontrados. Selecciona uno.', { icon: '🔍' });
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

  const checkoutMutation = usePosCheckout(activeShift, currentBranchId);

  const handleCheckoutPayment = async (method: PosPaymentMethodId) => {
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
    } else {
      setPaymentModalOpen(true);
    }
  };

  const handleConfirmCheckout = (status: 'CONFIRMED' | 'QUOTATION') => {
    checkoutMutation.mutate({
      status,
      grandTotal,
      subtotal,
      paymentMethod,
      issueInvoice
    });
  };

  if (isShiftLoading) {
    return <div style={{ padding: '40px', textAlign: 'center', fontWeight: 600 }}>Cargando estado de caja...</div>;
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
      />

      <div className={styles.main}>
        <POSProductGrid 
          products={gridProducts}
          searchResults={searchResults}
          search={search}
        />

        <POSCart 
          customersData={customersData}
          searchResults={searchResults}
          search={search}
          setSearch={setSearch}
          subtotal={subtotal}
          grandTotal={grandTotal}
          lineDiscounts={lineDiscounts}
          globalDiscount={globalDiscount}
          totalItems={totalItems}
          isOffline={!isOnline}
          catalogCount={catalogCount}
          onCheckoutQuotation={() => handleConfirmCheckout('QUOTATION')}
          onCheckoutPayment={handleCheckoutPayment}
        />
      </div>

      <POSModals 
        grandTotal={grandTotal}
        paymentMethod={paymentMethod}
        isGeneratingQr={isGeneratingQr}
        customersData={customersData}
        onConfirmCheckout={handleConfirmCheckout}
        isCheckoutLoading={checkoutMutation.isPending}
        activeShift={activeShift}
        registersData={registersData}
        isShiftLoading={isShiftLoading}
        issueInvoice={issueInvoice}
        setIssueInvoice={setIssueInvoice}
      />
    </div>
  );
}
