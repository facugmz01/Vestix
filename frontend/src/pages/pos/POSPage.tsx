import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { posApi } from '@/api/pos.api';
import { customersApi } from '@/api/customers.api';
import { treasuryApi } from '@/api/treasury.api';
import { queryKeys } from '@/api/queryKeys';
import { useAuthStore } from '@/store/auth.store';

import { usePosStore } from '@/features/pos/store/usePosStore';
import { usePosCheckout } from '@/features/pos/hooks/usePosCheckout';

import { POSHeader } from '@/features/pos/components/POSHeader';
import { POSProductGrid } from '@/features/pos/components/POSProductGrid';
import { POSCart } from '@/features/pos/components/POSCart';
import { POSModals } from '@/features/pos/components/POSModals';

import styles from './POSPage.module.css';

export default function POSPage() {
  const { user } = useAuthStore();
  const currentBranchId = user?.branchId || '';

  // 1. Estado Global del Cliente (Zustand)
  const cart = usePosStore(state => state.cart);
  const cartDiscountPct = usePosStore(state => state.cartDiscountPct);
  const selectedCustomerId = usePosStore(state => state.selectedCustomerId);
  const setPaymentModalOpen = usePosStore(s => s.setPaymentModalOpen);
  const setQrModalOpen = usePosStore(s => s.setQrModalOpen);
  
  // 2. Estado Local (Exclusivo de esta vista)
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH'|'CREDIT_CARD'|'CUSTOMER_CREDIT'|'BANK_TRANSFER'|'MULTIPLE'|'QR_MERCADOPAGO'>('CASH');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [issueInvoice, setIssueInvoice] = useState(false);

  // 3. Estado del Servidor (React Query)
  const { data: activeShift, isLoading: isShiftLoading } = useQuery({
    queryKey: ['shifts', 'active'],
    queryFn: () => treasuryApi.getActiveShift(),
  });

  const { data: registersData } = useQuery({
    queryKey: queryKeys.pos.registers(currentBranchId),
    queryFn: () => posApi.getAvailableRegisters(currentBranchId),
    enabled: !isShiftLoading && !activeShift,
  });

  const { data: gridProducts } = useQuery({
    queryKey: ['pos', 'gridProducts', selectedCustomerId],
    queryFn: () => posApi.searchProduct('', selectedCustomerId || undefined),
  });

  const { data: searchResults } = useQuery({
    queryKey: ['pos', 'search', search, selectedCustomerId],
    queryFn: () => posApi.searchProduct(search, selectedCustomerId || undefined),
    enabled: search.length >= 2,
  });

  const { data: customersData } = useQuery({
    queryKey: queryKeys.customers.all(),
    queryFn: () => customersApi.getCustomers({ pageSize: 1000 }),
  });

  // 4. Cálculos Derivados
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.variant.basePrice * item.qty), 0);
  const lineDiscounts = cart.reduce((acc, item) => acc + ((item.variant.basePrice * item.qty) * (item.discountPct / 100)), 0);
  const totalAfterLines = subtotal - lineDiscounts;
  const globalDiscount = totalAfterLines * (cartDiscountPct / 100);
  const grandTotal = totalAfterLines - globalDiscount;

  // 5. Mutación Checkout
  const checkoutMutation = usePosCheckout(activeShift, currentBranchId);

  const handleCheckoutPayment = async (method: typeof paymentMethod) => {
    if (cart.length === 0) return;
    setPaymentMethod(method);
    
    if (method === 'QR_MERCADOPAGO') {
      setQrModalOpen(true);
      setIsGeneratingQr(true);
      try {
        const res = await posApi.generateQrOrder(grandTotal, 'Cobro Vestix POS');
        usePosStore.getState().setQrModalOpen(true, res.qrData);
      } catch (err: any) {
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

  if (isShiftLoading) return <div style={{ padding: '40px', textAlign: 'center', fontWeight: 600 }}>Cargando estado de caja...</div>;

  return (
    <div className={styles.layout}>
      <POSHeader />

      <div className={styles.main}>
        {/* LEFT PANE - PRODUCTS */}
        <POSProductGrid 
          products={gridProducts}
          searchResults={searchResults}
          search={search}
        />

        {/* RIGHT PANE - CART */}
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
