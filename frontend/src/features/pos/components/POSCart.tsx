import { useQuery } from '@tanstack/react-query';
import { FileText, PauseCircle, CloudOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePosStore } from '../store/usePosStore';
import { customersApi } from '@/api/customers.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { computeIvaBreakdown } from '../utils/posTax';
import { POS_PAYMENT_METHODS, type PosPaymentMethodId } from '../constants/posPaymentMethods';
import { PosCustomerSearch } from './PosCustomerSearch';
import styles from '@/pages/pos/POSPage.module.css';

export function POSCart({
  subtotal,
  grandTotal,
  lineDiscounts,
  globalDiscount,
  totalItems,
  isOffline,
  catalogCount,
  appliedPromotions,
  onCheckoutQuotation,
  onCheckoutPayment,
}: {
  subtotal: number;
  grandTotal: number;
  lineDiscounts: number;
  globalDiscount: number;
  totalItems: number;
  isOffline?: boolean;
  catalogCount?: number;
  appliedPromotions?: string[];
  onCheckoutQuotation: () => void;
  onCheckoutPayment: (method: PosPaymentMethodId) => void;
}) {
  const cart = usePosStore(s => s.cart);
  const cartDiscountPct = usePosStore(s => s.cartDiscountPct);
  const selectedCustomerId = usePosStore(s => s.selectedCustomerId);

  const updateQty = usePosStore(s => s.updateQty);
  const updateDiscount = usePosStore(s => s.updateDiscount);
  const removeLine = usePosStore(s => s.removeLine);
  const setCartDiscountPct = usePosStore(s => s.setCartDiscountPct);
  const suspendSale = usePosStore(s => s.suspendSale);

  const { data: selectedCustomer } = useQuery({
    queryKey: ['customer', selectedCustomerId],
    queryFn: () => customersApi.getCustomer(selectedCustomerId),
    enabled: !!selectedCustomerId,
  });

  const iva = computeIvaBreakdown(grandTotal);

  const getVariantName = (variant: { name?: string; productName?: string; size?: string }) =>
    variant.name || variant.productName || 'Producto';

  const handlePaymentClick = (method: typeof POS_PAYMENT_METHODS[number]) => {
    if (method.requiresCustomer && !selectedCustomerId) {
      toast.error('Seleccioná un cliente para usar Cuenta Corriente');
      return;
    }
    if (method.requiresCustomer && selectedCustomer?.credit && selectedCustomer.credit.available < grandTotal) {
      toast.error('Crédito insuficiente para esta venta');
      return;
    }
    if (method.opensMixedModal) {
      onCheckoutPayment('MULTIPLE');
      return;
    }
    onCheckoutPayment(method.id);
  };

  return (
    <div className={styles.cartArea}>
      {isOffline && (
        <div className={styles.offlineBanner}>
          <CloudOff size={16} />
          <span>
            Modo offline
            {catalogCount ? ` · ${catalogCount} productos en catálogo local` : ' · descargá el catálogo cuando tengas red'}
            {' · las ventas se encolan para sincronizar'}
          </span>
        </div>
      )}
      <div className={styles.cartTop}>
        <PosCustomerSearch grandTotal={grandTotal} />
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.cartList}>
          {cart.length === 0 ? (
            <div className={`${styles.emptyState} ${styles.emptyStateTop}`}>
              <p>Escaneá o buscá productos</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.variant.id}-${index}`} className={styles.cartItem}>
                <div className={styles.cartItemDetails}>
                  <span className={styles.cartItemName}>
                    {getVariantName(item.variant as { name?: string; productName?: string; size?: string })}
                    {item.variant.size ? ` (${item.variant.size})` : ''}
                  </span>
                  <span className={styles.cartItemSku}>
                    {formatCurrency((item.variant.basePrice * item.qty) * (1 - item.discountPct / 100))}
                  </span>
                </div>

                <div className={styles.qtyControl}>
                  <button type="button" className={styles.qtyBtn} aria-label="Reducir cantidad" onClick={() => updateQty(item.variant.id, item.qty - 1)}>
                    −
                  </button>
                  <input
                    type="number"
                    className={styles.qtyInput}
                    value={item.qty}
                    min={1}
                    aria-label="Cantidad"
                    onChange={e => updateQty(item.variant.id, Number(e.target.value))}
                  />
                  <button type="button" className={styles.qtyBtn} aria-label="Aumentar cantidad" onClick={() => updateQty(item.variant.id, item.qty + 1)}>
                    +
                  </button>
                </div>

                <input
                  type="number"
                  min={0}
                  max={100}
                  aria-label="Descuento porcentaje"
                  value={item.discountPct}
                  onChange={e => updateDiscount(item.variant.id, Math.min(100, Math.max(0, Number(e.target.value))))}
                  className={styles.discountInput}
                />

                <button type="button" className={styles.removeBtn} aria-label="Eliminar línea" onClick={() => removeLine(item.variant.id)}>
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {appliedPromotions && appliedPromotions.length > 0 && (
        <div className={styles.promoBar}>
          {appliedPromotions.map(p => (
            <span key={p} className={styles.promoChip}>{p}</span>
          ))}
        </div>
      )}

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Items: {totalItems}</span>
          <span>Subtotal: {formatCurrency(subtotal)}</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.summaryRowCenter}`}>
          <span className={styles.discountLabelRow}>
            Descuento Global %:
            <input
              type="number"
              min={0}
              max={100}
              aria-label="Descuento global porcentaje"
              className={styles.discountInputLg}
              value={cartDiscountPct}
              onChange={e => setCartDiscountPct(Math.min(100, Math.max(0, Number(e.target.value))))}
            />
          </span>
          <span className={styles.discountTotal}>(-) {formatCurrency(lineDiscounts + globalDiscount)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>Neto gravado (21%)</span>
          <span>{formatCurrency(iva.net)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>IVA 21%</span>
          <span>{formatCurrency(iva.iva)}</span>
        </div>

        <div className={styles.totalRow}>
          <span>Total</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <div className={styles.actionButtons}>
        <button type="button" className={`${styles.posBtn} ${styles.bgQuotation}`} disabled={cart.length === 0} onClick={onCheckoutQuotation}>
          <FileText size={20} /> Cotización
        </button>
        <button type="button" className={`${styles.posBtn} ${styles.bgSuspend}`} disabled={cart.length === 0} onClick={() => {
          const pendingBefore = usePosStore.getState().suspendedSales.length;
          suspendSale(grandTotal);
          const pendingAfter = usePosStore.getState().suspendedSales.length;
          if (pendingAfter > pendingBefore) {
            toast.success(`Venta suspendida (${pendingAfter} pendiente${pendingAfter === 1 ? '' : 's'})`);
          }
        }}>
          <PauseCircle size={20} /> Suspender
        </button>
        {POS_PAYMENT_METHODS.map(method => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
              type="button"
              className={`${styles.posBtn} ${styles[method.cssClass as keyof typeof styles] || ''}`}
              disabled={cart.length === 0}
              onClick={() => handlePaymentClick(method)}
              title={method.label}
            >
              <Icon size={20} /> {method.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
