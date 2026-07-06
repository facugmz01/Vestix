import { useRef } from 'react';
import { Search, Plus, Minus, Trash2, User, FileText, PauseCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePosStore } from '../store/usePosStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { POS_PAYMENT_METHODS, type PosPaymentMethodId } from '../constants/posPaymentMethods';
import styles from '@/pages/pos/POSPage.module.css';
import type { ProductVariant } from '@/types';

export function POSCart({
  customersData,
  searchResults,
  search,
  setSearch,
  subtotal,
  grandTotal,
  lineDiscounts,
  globalDiscount,
  totalItems,
  onCheckoutQuotation,
  onCheckoutPayment,
}: {
  customersData: { data?: { id: string; fullName: string }[] } | undefined;
  searchResults: ProductVariant[] | undefined;
  search: string;
  setSearch: (s: string) => void;
  subtotal: number;
  grandTotal: number;
  lineDiscounts: number;
  globalDiscount: number;
  totalItems: number;
  onCheckoutQuotation: () => void;
  onCheckoutPayment: (method: PosPaymentMethodId) => void;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const cart = usePosStore(s => s.cart);
  const cartDiscountPct = usePosStore(s => s.cartDiscountPct);
  const selectedCustomerId = usePosStore(s => s.selectedCustomerId);
  
  const addToCart = usePosStore(s => s.addToCart);
  const updateQty = usePosStore(s => s.updateQty);
  const updateDiscount = usePosStore(s => s.updateDiscount);
  const removeLine = usePosStore(s => s.removeLine);
  const setCustomerId = usePosStore(s => s.setCustomerId);
  const setCartDiscountPct = usePosStore(s => s.setCartDiscountPct);
  const setCustomerFormOpen = usePosStore(s => s.setCustomerFormOpen);
  const suspendSale = usePosStore(s => s.suspendSale);
  const setMixedPaymentModalOpen = usePosStore(s => s.setMixedPaymentModalOpen);

  const getVariantName = (variant: ProductVariant) => {
    const v = variant as ProductVariant & { name?: string; productName?: string };
    return v.name || v.productName || 'Producto';
  };

  const handlePaymentClick = (method: typeof POS_PAYMENT_METHODS[number]) => {
    if (method.requiresCustomer && !selectedCustomerId) {
      toast.error('Seleccioná un cliente para usar Cuenta Corriente');
      return;
    }
    if (method.opensMixedModal) {
      setMixedPaymentModalOpen(true);
      return;
    }
    onCheckoutPayment(method.id);
  };

  return (
    <div className={styles.cartArea}>
      <div className={styles.cartTop}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
            <select 
              value={selectedCustomerId} 
              onChange={e => setCustomerId(e.target.value)}
              style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', appearance: 'none' }}
            >
              <option value="">Consumidor Final</option>
              {customersData?.data?.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
          <button onClick={() => setCustomerFormOpen(true)} style={{ padding: '0 16px', background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
            <Plus size={20} />
          </button>
        </div>

        <div className={styles.searchInputWrapper}>
          <Search size={20} className={styles.searchIcon} />
          <input 
            ref={searchInputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nombre, SKU o código de barras..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && searchResults?.length === 1) {
                addToCart(searchResults[0]);
                setSearch('');
              }
            }}
            autoFocus
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.cartList}>
          {cart.length === 0 ? (
            <div className={styles.emptyState} style={{ marginTop: '40px' }}>
              <Search size={48} opacity={0.5} />
              <p>Escanea o busca productos</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={`${item.variant.id}-${index}`} className={styles.cartItem}>
                <div className={styles.cartItemDetails}>
                  <span className={styles.cartItemName}>
                    {getVariantName(item.variant)} {item.variant.size ? `(${item.variant.size})` : ''}
                  </span>
                  <span className={styles.cartItemSku}>
                    {formatCurrency((item.variant.basePrice * item.qty) * (1 - item.discountPct / 100))}
                  </span>
                </div>

                <div className={styles.qtyControl}>
                  <button className={styles.qtyBtn} onClick={() => updateQty(item.variant.id, item.qty - 1)}><Minus size={14} /></button>
                  <input 
                    type="number" 
                    className={styles.qtyInput} 
                    value={item.qty} 
                    min={1}
                    onChange={e => updateQty(item.variant.id, Number(e.target.value))}
                  />
                  <button className={styles.qtyBtn} onClick={() => updateQty(item.variant.id, item.qty + 1)}><Plus size={14} /></button>
                </div>

                <input
                  type="number"
                  min={0}
                  max={100}
                  title="Descuento %"
                  value={item.discountPct}
                  onChange={e => updateDiscount(item.variant.id, Math.min(100, Math.max(0, Number(e.target.value))))}
                  style={{ width: '48px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', textAlign: 'center', fontSize: '12px' }}
                />

                <button className={styles.removeBtn} onClick={() => removeLine(item.variant.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Items: {totalItems}</span>
          <span>Subtotal: {formatCurrency(subtotal)}</span>
        </div>
        <div className={styles.summaryRow} style={{ alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Descuento Global %: 
            <input 
              type="number" 
              min={0}
              max={100}
              style={{ width: '60px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', textAlign: 'center' }} 
              value={cartDiscountPct} 
              onChange={e => setCartDiscountPct(Math.min(100, Math.max(0, Number(e.target.value))))} 
            />
          </span>
          <span style={{ color: '#f87171' }}>(-) {formatCurrency(lineDiscounts + globalDiscount)}</span>
        </div>
        
        <div className={styles.totalRow}>
          <span>Total</span>
          <span>{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <div className={styles.actionButtons}>
        <button className={`${styles.posBtn} ${styles.bgQuotation}`} disabled={cart.length === 0} onClick={onCheckoutQuotation}>
          <FileText size={20} /> Cotización
        </button>
        <button className={`${styles.posBtn} ${styles.bgSuspend}`} disabled={cart.length === 0} onClick={() => suspendSale(grandTotal)}>
          <PauseCircle size={20} /> Suspender
        </button>
        {POS_PAYMENT_METHODS.map(method => {
          const Icon = method.icon;
          return (
            <button
              key={method.id}
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
