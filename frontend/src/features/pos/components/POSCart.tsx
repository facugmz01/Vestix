import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, PauseCircle, CloudOff, Tags, Trash2, Gift, ChevronDown, Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { usePosStore } from '../store/usePosStore';
import { customersApi } from '@/api/customers.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { computeIvaBreakdown } from '../utils/posTax';
import { type PosPaymentMethodId } from '../constants/posPaymentMethods';
import { CheckoutDialog } from './CheckoutDialog';
import { PosCustomerSearch } from './PosCustomerSearch';
import { PosRedemptionPanel } from './PosRedemptionPanel';
import { DiscountModal, type DiscountApplyData } from './DiscountModal';
import { resolveProductImage } from '@/utils/imageUrl';
import { SafeImage } from '@/components/ui';
import orderStyles from './OrderPanel.module.css';
import styles from '@/pages/pos/POSPage.module.css';
import cartStyles from './POSCart.module.css';

type CartVariant = {
  id: string;
  name?: string;
  productName?: string;
  size?: string;
  color?: string;
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
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [initialCheckoutMethod, setInitialCheckoutMethod] = useState<PosPaymentMethodId>();
  const [pulsingVariantId, setPulsingVariantId] = useState<string | null>(null);

  const handleUpdateQty = (variantId: string, newQty: number) => {
    updateQty(variantId, newQty);
    setPulsingVariantId(variantId);
    setTimeout(() => {
      setPulsingVariantId(prev => (prev === variantId ? null : prev));
    }, 350);
  };

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

  const getVariantName = (variant: CartVariant) =>
    variant.name || variant.productName || variant.product?.name || 'Producto';

  const getVariantImage = (variant: CartVariant) => resolveProductImage(variant);

  const handleClearCart = () => {
    if (cart.length === 0) return;
    clearCart();
    toast.success('Pedido vaciado');
  };

  const handleApplyCreditBalance = (balance: number) => {
    if (balance <= 0) return;
    if (amountDue <= balance) {
      setInitialCheckoutMethod('STORE_CREDIT');
      setCheckoutOpen(true);
    } else {
      setInitialCheckoutMethod('MULTIPLE');
      setCheckoutOpen(true);
    }
  };

  const handlePay = () => {
    setInitialCheckoutMethod(undefined);
    setCheckoutOpen(true);
  };

  const startPayment = (method: PosPaymentMethodId, reference?: string) => {
    if (method === 'STORE_CREDIT') {
      if (!selectedCustomerId) {
        toast.error('Seleccioná un cliente para usar Saldo a Favor');
        return;
      }
      const available = Number(selectedCustomer?.creditBalance) || 0;
      if (available <= 0) {
        toast.error('El cliente no tiene saldo a favor disponible');
        return;
      }
      if (available < amountDue) {
        toast.error(
          `Saldo a favor ($${available.toLocaleString('es-AR')}) insuficiente para el total ($${amountDue.toLocaleString('es-AR')}). Usá Pago Mixto para descontarlo.`,
        );
        return;
      }
    } else if (method === 'CUSTOMER_CREDIT') {
      if (!selectedCustomerId) {
        toast.error('Seleccioná un cliente para usar Cuenta Corriente');
        return;
      }
      if (selectedCustomer?.credit && selectedCustomer.credit.available < amountDue) {
        toast.error('Crédito insuficiente para esta venta');
        return;
      }
    }
    setCheckoutOpen(false);
    onCheckoutPayment(method);
    usePosStore.getState().setPaymentReference(reference || '');
  };

  return (
    <aside className={`${styles.cartArea} ${orderStyles.panel}`} aria-label="Pedido actual">
      {isOffline && (
        <div className={orderStyles.offline}>
          <CloudOff size={16} />
          <span>
            Offline{catalogCount ? ` · ${catalogCount} en catálogo` : ''}
          </span>
        </div>
      )}

      <div className={orderStyles.header}>
        <div className={orderStyles.heading}>
          <div className={orderStyles.title}>Pedido</div>
          <div className={orderStyles.meta}>{cart.length} artículo{cart.length === 1 ? '' : 's'} · {totalItems} unidad{totalItems === 1 ? '' : 'es'}</div>
        </div>
        <button
          type="button"
          className={orderStyles.clear}
          onClick={handleClearCart}
          disabled={cart.length === 0}
          aria-label="Vaciar pedido"
          title="Vaciar pedido"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className={orderStyles.customer}>
        <PosCustomerSearch amountDue={amountDue} onApplyCreditBalance={handleApplyCreditBalance} />
        <button
          type="button"
          className={orderStyles.extras}
          onClick={() => setExtrasOpen(v => !v)}
          aria-expanded={extrasOpen}
        >
          <Gift size={14} />
          <span>Gift card / Puntos{hasRedemptionApplied ? ' · aplicado' : ''}</span>
          <ChevronDown size={15} className={extrasOpen ? styles.extrasChevronOpen : undefined} />
        </button>
        {extrasOpen && (
          <div className={orderStyles.extrasBody}>
            <PosRedemptionPanel merchandiseTotal={grandTotal} />
          </div>
        )}
      </div>

      <div className={orderStyles.list}>
        {cart.length === 0 ? (
          <div className={orderStyles.empty}>
            <Tags size={22} className={orderStyles.emptyIcon} />
            <p className={orderStyles.emptyTitle}>El pedido está vacío</p>
            <p className={orderStyles.emptyHint}>Escaneá un código o elegí prendas del catálogo.<br/>F2 para buscar · F4 para efectivo</p>
          </div>
        ) : (
        <div className={orderStyles.items}>
            {cart.map((item, index) => {
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
                <div key={`${variant.id}-${index}`} className={`${orderStyles.item} ${index === cart.length - 1 ? orderStyles.itemLatest : ''}`}>
                  <div className={orderStyles.thumb} aria-hidden={!imageUrl}>
                    <SafeImage
                      src={imageUrl}
                      alt=""
                      className={orderStyles.thumb}
                      fallback={<Tags size={18} />}
                    />
                  </div>

                  <div className={orderStyles.details}>
                    <div className={orderStyles.topline}>
                    <span className={orderStyles.name}>
                      {getVariantName(variant)}
                      {isCombo && <span className={styles.comboBadge}>COMBO</span>}
                    </span>
                    <span className={orderStyles.lineTotal}>{formatCurrency(lineTotal)}</span>
                    </div>
                    <div className={orderStyles.subline}>
                      <span className={orderStyles.sku}>{variant.sku || 'Sin SKU'}</span>
                      {variant.color && <span>{variant.color}</span>}
                      {variant.size && <span>Talle {variant.size}</span>}
                      <span>{formatCurrency(effectivePrice)} c/u</span>
                      {hasDiscount && <span className={orderStyles.discount}>−{item.discountType === 'FIXED' ? formatCurrency(item.discountValue || 0) : `${item.discountValue ?? item.discountPct}%`}</span>}
                      {isPriceOverridden && <span>Precio editado</span>}
                      {isCombo && comboLines?.length ? <span>Combo · {comboLines.length} prendas</span> : null}
                    </div>

                    {isCombo && comboLines && comboLines.length > 0 && (
                      <details className={orderStyles.combo}>
                        <summary>Ver componentes del combo</summary>
                        <ul>
                          {comboLines.map((cl, clIdx) => {
                            const compName = cl.childVariant?.product?.name || cl.productName || 'Componente';
                            const compSku = cl.childVariant?.sku || cl.variantSku;
                            const compQty = cl.quantity * item.qty;
                            return (
                              <li key={cl.id || cl.childVariantId || clIdx}>
                                <span>{compQty} × </span>
                                <span>
                                  {compName} {cl.childVariant?.size ? `(${cl.childVariant.size})` : ''}
                                </span>
                                {compSku && <span> · {compSku}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    )}

                    <div className={`${orderStyles.tools} ${pulsingVariantId === variant.id ? cartStyles.qtyPulse : ''}`}>
                      <div className={orderStyles.qty}>
                      <button
                        type="button"
                        aria-label="Reducir cantidad"
                        onClick={() => handleUpdateQty(variant.id, item.qty - 1)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        className={orderStyles.qtyInput}
                        value={item.qty}
                        min={1}
                        aria-label="Cantidad"
                        onChange={e => handleUpdateQty(variant.id, Number(e.target.value))}
                      />
                      <button
                        type="button"
                        aria-label="Aumentar cantidad"
                        onClick={() => handleUpdateQty(variant.id, item.qty + 1)}
                      >
                        +
                      </button>

                      </div>
                      <div className={orderStyles.actions}>
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
                        className={orderStyles.iconAction}
                      >
                        <Tag size={14} />
                        <span className={orderStyles.srOnly}>{isPriceOverridden || hasDiscount ? 'Editar descuento o precio' : 'Aplicar descuento o precio'}</span>
                      </button>
                      <button type="button" className={`${orderStyles.iconAction} ${orderStyles.remove}`} aria-label={`Eliminar ${getVariantName(variant)}`} onClick={() => removeLine(variant.id)}><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        )}
      </div>

      {appliedPromotions && appliedPromotions.length > 0 && (
        <div className={orderStyles.promo}>
          {appliedPromotions.map(p => (
            <span key={p} className={orderStyles.promoChip}>{p}</span>
          ))}
        </div>
      )}

      <footer className={orderStyles.footer}>
        <div className={orderStyles.totals}>
          <div className={orderStyles.totalLine}>
            <span>Subtotal</span>
            <span className={orderStyles.totalValue}>{formatCurrency(subtotal)}</span>
          </div>

          {lineDiscounts > 0 && (
            <div className={orderStyles.totalLine}>
              <span>Descuentos Línea</span>
              <span className={orderStyles.discount}>(−) {formatCurrency(lineDiscounts)}</span>
            </div>
          )}

          <div className={orderStyles.totalLine}>
            <span>
              Desc. Global{' '}
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
                className={orderStyles.discountButton}
              >
                {globalDiscountType === 'FIXED' ? '$' : '%'} {globalDiscountValue > 0 ? `${globalDiscountValue}${globalDiscountType === 'PERCENTAGE' ? '%' : ''}` : 'Aplicar'}
              </button>
            </span>
            <span className={orderStyles.discount}>(−) {formatCurrency(globalDiscount)}</span>
          </div>

          <div className={orderStyles.totalLine}>
            <span>IVA 21%</span>
            <span className={orderStyles.totalValue}>{formatCurrency(iva.iva)}</span>
          </div>

          {(giftCardAmount > 0 || loyaltyDiscount > 0) && (
            <>
              {giftCardAmount > 0 && (
                <div className={orderStyles.totalLine}>
                  <span>Gift card</span>
                  <span className={orderStyles.discount}>(−) {formatCurrency(giftCardAmount)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className={orderStyles.totalLine}>
                  <span>Puntos</span>
                  <span className={orderStyles.discount}>(−) {formatCurrency(loyaltyDiscount)}</span>
                </div>
              )}
            </>
          )}
          <div className={`${orderStyles.totalLine} ${orderStyles.total}`}>
            <span>{amountDue < grandTotal ? 'A cobrar' : 'Total'}</span>
            <span className={orderStyles.totalValue}>{formatCurrency(amountDue)}</span>
          </div>
        </div>

        <button type="button" className={orderStyles.pay} disabled={cart.length === 0} onClick={handlePay}>Cobrar · {formatCurrency(amountDue)}</button>
        <div className={orderStyles.secondary}>
          <button type="button" disabled={cart.length === 0} onClick={onCheckoutQuotation}><FileText size={13}/> Cotización</button>
          <button type="button" disabled={cart.length === 0} onClick={() => { const before = usePosStore.getState().suspendedSales.length; suspendSale(grandTotal); const after = usePosStore.getState().suspendedSales.length; if (after > before) toast.success(`Venta suspendida (${after} pendiente${after === 1 ? '' : 's'})`); }}><PauseCircle size={13}/> Suspender</button>
          <button type="button" disabled={usePosStore.getState().suspendedSales.length === 0} onClick={() => usePosStore.getState().setSuspendModalOpen(true)}>Recuperar</button>
        </div>
      </footer>

      {checkoutOpen && <CheckoutDialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} onSelectMethod={startPayment} amountDue={amountDue} grandTotal={grandTotal} cart={cart} totalItems={totalItems} customerName={selectedCustomer?.fullName || 'Consumidor final'} initialMethod={initialCheckoutMethod} />}

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


