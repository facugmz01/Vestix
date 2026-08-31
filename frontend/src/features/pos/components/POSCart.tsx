import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, PauseCircle, CloudOff, Tags, Trash2, Gift, ChevronDown, Tag, Edit3, Percent, DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePosStore } from '../store/usePosStore';
import { customersApi } from '@/api/customers.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { computeIvaBreakdown } from '../utils/posTax';
import { POS_PAYMENT_METHODS, type PosPaymentMethodId } from '../constants/posPaymentMethods';
import { PosCustomerSearch } from './PosCustomerSearch';
import { PosRedemptionPanel } from './PosRedemptionPanel';
import { DiscountModal, type DiscountApplyData } from './DiscountModal';
import styles from '@/pages/pos/POSPage.module.css';

type CartVariant = {
  id: string;
  name?: string;
  productName?: string;
  size?: string;
  sku?: string;
  basePrice: number;
  imageUrl?: string | null;
  product?: {
    name?: string;
    type?: string;
    images?: string[];
    comboLines?: Array<{
      id?: string;
      childVariantId: string;
      quantity: number;
      productName?: string;
      variantSku?: string;
      childVariant?: {
        sku?: string;
        size?: string;
        color?: string;
        basePrice?: number;
        product?: { name?: string };
      };
    }>;
  };
};

export function POSCart({
  subtotal,
  grandTotal,
  amountDue,
  giftCardAmount,
  loyaltyDiscount,
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
  amountDue: number;
  giftCardAmount: number;
  loyaltyDiscount: number;
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
  const globalDiscountType = usePosStore(s => s.globalDiscountType);
  const globalDiscountValue = usePosStore(s => s.globalDiscountValue);
  const selectedCustomerId = usePosStore(s => s.selectedCustomerId);

  const updateQty = usePosStore(s => s.updateQty);
  const updateDiscount = usePosStore(s => s.updateDiscount);
  const updateLineDiscountAndPrice = usePosStore(s => s.updateLineDiscountAndPrice);
  const setGlobalDiscountData = usePosStore(s => s.setGlobalDiscountData);
  const removeLine = usePosStore(s => s.removeLine);
  const clearCart = usePosStore(s => s.clearCart);
  const setCartDiscountPct = usePosStore(s => s.setCartDiscountPct);
  const suspendSale = usePosStore(s => s.suspendSale);

  const [extrasOpen, setExtrasOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PosPaymentMethodId>('CASH');

  const [discountModalConfig, setDiscountModalConfig] = useState<{
    open: boolean;
    mode: 'LINE' | 'GLOBAL';
    variantId?: string;
    productName?: string;
    basePrice?: number;
    customUnitPrice?: number;
    quantity?: number;
    discountType?: 'PERCENTAGE' | 'FIXED';
    discountValue?: number;
  }>({ open: false, mode: 'GLOBAL' });

  const { data: selectedCustomer } = useQuery({
    queryKey: ['customer', selectedCustomerId],
    queryFn: () => customersApi.getCustomer(selectedCustomerId),
    enabled: !!selectedCustomerId,
  });

  const iva = computeIvaBreakdown(grandTotal);
  const hasRedemptionApplied = giftCardAmount > 0 || loyaltyDiscount > 0;
  const selectedConfig = POS_PAYMENT_METHODS.find(m => m.id === selectedMethod);

  const getVariantName = (variant: CartVariant) =>
    variant.name || variant.productName || variant.product?.name || 'Producto';

  const getVariantImage = (variant: CartVariant) =>
    variant.imageUrl || variant.product?.images?.[0] || null;

  const handleClearCart = () => {
    if (cart.length === 0) return;
    clearCart();
    toast.success('Pedido vaciado');
  };

  const handlePay = () => {
    if (!selectedConfig) return;
    if (selectedConfig.requiresCustomer && !selectedCustomerId) {
      toast.error('Seleccioná un cliente para usar Cuenta Corriente');
      return;
    }
    if (selectedConfig.requiresCustomer && selectedCustomer?.credit && selectedCustomer.credit.available < amountDue) {
      toast.error('Crédito insuficiente para esta venta');
      return;
    }
    onCheckoutPayment(selectedConfig.id);
  };

  return (
    <aside className={styles.cartArea} aria-label="Pedido actual">
      {isOffline && (
        <div className={styles.offlineBanner}>
          <CloudOff size={16} />
          <span>
            Offline{catalogCount ? ` · ${catalogCount} en catálogo` : ''}
          </span>
        </div>
      )}

      <div className={styles.orderHeader}>
        <div>
          <div className={styles.orderTitle}>Pedido</div>
          <div className={styles.orderMeta}>{totalItems} ítem{totalItems === 1 ? '' : 's'}</div>
        </div>
        <button
          type="button"
          className={styles.clearOrderBtn}
          onClick={handleClearCart}
          disabled={cart.length === 0}
          aria-label="Vaciar pedido"
          title="Vaciar pedido"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className={styles.cartTop}>
        <PosCustomerSearch amountDue={amountDue} />
        <button
          type="button"
          className={styles.extrasToggle}
          onClick={() => setExtrasOpen(v => !v)}
          aria-expanded={extrasOpen}
        >
          <Gift size={14} />
          <span>Gift card / Puntos{hasRedemptionApplied ? ' · aplicado' : ''}</span>
          <ChevronDown size={16} className={extrasOpen ? styles.extrasChevronOpen : undefined} />
        </button>
        {extrasOpen && (
          <div className={styles.extrasPanel}>
            <PosRedemptionPanel merchandiseTotal={grandTotal} />
          </div>
        )}
      </div>

      <div className={styles.tableContainer} data-has-items={cart.length > 0}>
        <div className={styles.cartList}>
          {cart.length === 0 ? (
            <div className={styles.cartEmpty}>
              <Tags size={28} />
              <p>Elegí productos del catálogo</p>
            </div>
          ) : (
            cart.map((item, index) => {
              const variant = item.variant as CartVariant;
              const imageUrl = getVariantImage(variant);
              const effectivePrice = item.customUnitPrice ?? variant.basePrice;
              const isPriceOverridden = item.customUnitPrice !== undefined && Math.abs(item.customUnitPrice - variant.basePrice) > 0.01;
              const hasDiscount = (item.discountType === 'FIXED' && (item.discountValue || 0) > 0) || (item.discountPct > 0);
              
              const discountAmt = item.discountType === 'FIXED'
                ? Math.min(effectivePrice * item.qty, item.discountValue || 0)
                : (effectivePrice * item.qty) * ((item.discountValue ?? item.discountPct ?? 0) / 100);
              const lineTotal = Math.max(0, (effectivePrice * item.qty) - discountAmt);
              const isCombo = variant.product?.type === 'COMBO';
              const comboLines = variant.product?.comboLines;

              return (
                <div key={`${variant.id}-${index}`} className={styles.cartItem}>
                  <div className={styles.cartItemThumb} aria-hidden={!imageUrl}>
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className={styles.cartItemThumbImg} />
                    ) : (
                      <Tags size={18} />
                    )}
                  </div>

                  <div className={styles.cartItemDetails}>
                    <span className={styles.cartItemName}>
                      {getVariantName(variant)}
                      {isCombo && <span className={styles.comboBadge}>COMBO</span>}
                    </span>
                    <span className={styles.cartItemSku}>
                      {variant.sku || '—'}
                      {variant.size ? ` · ${variant.size}` : ''}
                      {isPriceOverridden && (
                        <span style={{ color: 'var(--color-primary-600, #2563eb)', fontWeight: 600, marginLeft: 4 }}>
                          · Precio: {formatCurrency(effectivePrice)}
                        </span>
                      )}
                      {hasDiscount && (
                        <span style={{ color: 'var(--color-danger-600, #dc2626)', fontWeight: 600, marginLeft: 4 }}>
                          · −{item.discountType === 'FIXED' ? formatCurrency(item.discountValue || 0) : `${item.discountValue ?? item.discountPct}%`}
                        </span>
                      )}
                    </span>

                    {isCombo && comboLines && comboLines.length > 0 && (
                      <div className={styles.comboBreakdown}>
                        <div className={styles.comboBreakdownTitle}>
                          Contiene {comboLines.length} producto{comboLines.length === 1 ? '' : 's'}:
                        </div>
                        <ul className={styles.comboBreakdownList}>
                          {comboLines.map((cl, clIdx) => {
                            const compName = cl.childVariant?.product?.name || cl.productName || 'Componente';
                            const compSku = cl.childVariant?.sku || cl.variantSku;
                            const compQty = cl.quantity * item.qty;
                            return (
                              <li key={cl.id || cl.childVariantId || clIdx} className={styles.comboBreakdownItem}>
                                <span className={styles.comboItemQty}>• {compQty}x</span>
                                <span className={styles.comboItemName}>
                                  {compName} {cl.childVariant?.size ? `(${cl.childVariant.size})` : ''}
                                </span>
                                {compSku && <span className={styles.comboItemSku}>[{compSku}]</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    <div className={styles.qtyControl}>
                      <button type="button" className={styles.qtyBtn} aria-label="Reducir cantidad" onClick={() => updateQty(variant.id, item.qty - 1)}>
                        −
                      </button>
                      <input
                        type="number"
                        className={styles.qtyInput}
                        value={item.qty}
                        min={1}
                        aria-label="Cantidad"
                        onChange={e => updateQty(variant.id, Number(e.target.value))}
                      />
                      <button type="button" className={styles.qtyBtn} aria-label="Aumentar cantidad" onClick={() => updateQty(variant.id, item.qty + 1)}>
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDiscountModalConfig({
                            open: true,
                            mode: 'LINE',
                            variantId: variant.id,
                            productName: getVariantName(variant),
                            basePrice: variant.basePrice,
                            customUnitPrice: item.customUnitPrice,
                            quantity: item.qty,
                            discountType: item.discountType || 'PERCENTAGE',
                            discountValue: item.discountValue ?? item.discountPct ?? 0,
                          })
                        }
                        title="Modificar precio o aplicar descuento a esta línea"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '3px 7px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          borderRadius: '4px',
                          border: isPriceOverridden || hasDiscount ? '1px solid var(--color-primary-300, #93c5fd)' : '1px solid var(--color-border-subtle, #cbd5e1)',
                          background: isPriceOverridden || hasDiscount ? 'var(--color-primary-50, #eff6ff)' : '#fff',
                          color: isPriceOverridden || hasDiscount ? 'var(--color-primary-700, #1d4ed8)' : 'var(--color-text-secondary, #475569)',
                          cursor: 'pointer',
                          marginLeft: '4px',
                        }}
                      >
                        <Tag size={12} />
                        {isPriceOverridden || hasDiscount ? 'Editado' : 'Desc / Precio'}
                      </button>
                    </div>
                  </div>

                  <div className={styles.cartItemRight}>
                    <span className={styles.cartItemLineTotal}>{formatCurrency(lineTotal)}</span>
                    <button type="button" className={styles.removeBtn} aria-label="Eliminar línea" onClick={() => removeLine(variant.id)}>
                      ×
                    </button>
                  </div>
                </div>
              );
            })
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

      <div className={styles.checkoutDock}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {lineDiscounts > 0 && (
            <div className={styles.summaryRow} style={{ color: 'var(--color-danger-600, #dc2626)' }}>
              <span>Descuentos Línea</span>
              <span className={styles.discountTotal}>(−) {formatCurrency(lineDiscounts)}</span>
            </div>
          )}

          <div className={`${styles.summaryRow} ${styles.summaryRowCenter}`}>
            <span className={styles.discountLabelRow}>
              <span>Desc. Global:</span>
              <button
                type="button"
                onClick={() =>
                  setDiscountModalConfig({
                    open: true,
                    mode: 'GLOBAL',
                    discountType: globalDiscountType,
                    discountValue: globalDiscountValue,
                  })
                }
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-subtle, #cbd5e1)',
                  background: globalDiscount > 0 ? 'var(--color-primary-50, #eff6ff)' : '#fff',
                  color: globalDiscount > 0 ? 'var(--color-primary-700, #1d4ed8)' : 'var(--color-text-secondary, #475569)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: '4px',
                }}
              >
                {globalDiscountType === 'FIXED' ? '$' : '%'} {globalDiscountValue > 0 ? `${globalDiscountValue}${globalDiscountType === 'PERCENTAGE' ? '%' : ''}` : 'Aplicar'}
              </button>
            </span>
            <span className={styles.discountTotal}>(−) {formatCurrency(globalDiscount)}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>IVA 21%</span>
            <span>{formatCurrency(iva.iva)}</span>
          </div>

          {(giftCardAmount > 0 || loyaltyDiscount > 0) && (
            <>
              {giftCardAmount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Gift card</span>
                  <span className={styles.discountTotal}>(−) {formatCurrency(giftCardAmount)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className={styles.summaryRow}>
                  <span>Puntos</span>
                  <span className={styles.discountTotal}>(−) {formatCurrency(loyaltyDiscount)}</span>
                </div>
              )}
            </>
          )}
          <div className={styles.totalRow}>
            <span>{amountDue < grandTotal ? 'A cobrar' : 'Total'}</span>
            <span>{formatCurrency(amountDue)}</span>
          </div>
        </div>

        <div className={styles.paySection}>
          <div className={styles.paySectionLabel}>Forma de pago</div>
          <div className={styles.methodChips} role="radiogroup" aria-label="Forma de pago">
            {POS_PAYMENT_METHODS.map(method => {
              const Icon = method.icon;
              const active = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`${styles.methodChip} ${active ? styles.methodChipActive : ''}`}
                  disabled={cart.length === 0}
                  onClick={() => setSelectedMethod(method.id)}
                  title={method.label}
                >
                  <Icon size={15} />
                  <span>{method.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.payPrimaryBtn}
            disabled={cart.length === 0}
            onClick={handlePay}
          >
            Cobrar · {selectedConfig?.shortLabel || 'Pago'}
          </button>

          <div className={styles.secondaryActions}>
            <button type="button" className={styles.secondaryBtn} disabled={cart.length === 0} onClick={onCheckoutQuotation}>
              <FileText size={15} />
              Cotización
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={cart.length === 0}
              onClick={() => {
                const pendingBefore = usePosStore.getState().suspendedSales.length;
                suspendSale(grandTotal);
                const pendingAfter = usePosStore.getState().suspendedSales.length;
                if (pendingAfter > pendingBefore) {
                  toast.success(`Venta suspendida (${pendingAfter} pendiente${pendingAfter === 1 ? '' : 's'})`);
                }
              }}
            >
              <PauseCircle size={15} />
              Suspender
            </button>
          </div>
        </div>
      </div>

      {/* DISCOUNT MODAL (LINE / GLOBAL) */}
      <DiscountModal
        open={discountModalConfig.open}
        onClose={() => setDiscountModalConfig(c => ({ ...c, open: false }))}
        mode={discountModalConfig.mode}
        initialBasePrice={discountModalConfig.basePrice}
        initialCustomUnitPrice={discountModalConfig.customUnitPrice}
        initialQuantity={discountModalConfig.quantity}
        initialDiscountType={discountModalConfig.discountType}
        initialDiscountValue={discountModalConfig.discountValue}
        productName={discountModalConfig.productName}
        subtotal={subtotal - lineDiscounts}
        onApply={(data: DiscountApplyData) => {
          if (data.mode === 'LINE' && discountModalConfig.variantId) {
            updateLineDiscountAndPrice(discountModalConfig.variantId, {
              customUnitPrice: data.customUnitPrice,
              discountType: data.discountType,
              discountValue: data.discountValue,
              supervisorApprovalToken: data.supervisorApprovalToken,
              authorizedByName: data.authorizedByName,
            });
          } else if (data.mode === 'GLOBAL') {
            setGlobalDiscountData({
              discountType: data.discountType,
              discountValue: data.discountValue,
              supervisorApprovalToken: data.supervisorApprovalToken,
              authorizedByName: data.authorizedByName,
            });
          }
        }}
      />
    </aside>
  );
}
