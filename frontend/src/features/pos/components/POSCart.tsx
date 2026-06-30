import { useRef, useState } from 'react';
import { Search, Plus, Minus, Trash2, User, FileText, PauseCircle, CreditCard, Banknote } from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '../../pages/pos/POSPage.module.css';

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
  customersData: any;
  searchResults: any;
  search: string;
  setSearch: (s: string) => void;
  subtotal: number;
  grandTotal: number;
  lineDiscounts: number;
  globalDiscount: number;
  totalItems: number;
  onCheckoutQuotation: () => void;
  onCheckoutPayment: (method: 'CASH' | 'CREDIT_CARD' | 'QR_MERCADOPAGO' | 'MULTIPLE') => void;
}) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const cart = usePosStore(s => s.cart);
  const cartDiscountPct = usePosStore(s => s.cartDiscountPct);
  const selectedCustomerId = usePosStore(s => s.selectedCustomerId);
  
  const addToCart = usePosStore(s => s.addToCart);
  const updateQty = usePosStore(s => s.updateQty);
  const removeLine = usePosStore(s => s.removeLine);
  const setCustomerId = usePosStore(s => s.setCustomerId);
  const setCartDiscountPct = usePosStore(s => s.setCartDiscountPct);
  const setCustomerFormOpen = usePosStore(s => s.setCustomerFormOpen);
  const suspendSale = usePosStore(s => s.suspendSale);

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
              {customersData?.data.map((c: any) => <option key={c.id} value={c.id}>{c.fullName}</option>)}
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
                    {(item.variant as any).name || (item.variant as any).productName || 'Producto'} {item.variant.size ? `(${item.variant.size})` : ''}
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
                    onChange={e => updateQty(item.variant.id, Number(e.target.value))}
                  />
                  <button className={styles.qtyBtn} onClick={() => updateQty(item.variant.id, item.qty + 1)}><Plus size={14} /></button>
                </div>

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
              style={{ width: '60px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', textAlign: 'center' }} 
              value={cartDiscountPct} 
              onChange={e => setCartDiscountPct(Number(e.target.value))} 
            />
          </span>
          <span style={{ color: '#f87171' }}>(-) {formatCurrency(globalDiscount + lineDiscounts)}</span>
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
        <button className={`${styles.posBtn} ${styles.bgCredit}`} disabled={cart.length === 0} onClick={() => onCheckoutPayment('CREDIT_CARD')}>
          <CreditCard size={20} /> Tarjeta
        </button>
        <button className={`${styles.posBtn} ${styles.bgCash}`} disabled={cart.length === 0} onClick={() => onCheckoutPayment('CASH')}>
          <Banknote size={20} /> Efectivo
        </button>
      </div>
    </div>
  );
}
