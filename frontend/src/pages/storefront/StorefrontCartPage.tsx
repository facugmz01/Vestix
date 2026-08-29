import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { Trash2, ArrowRight, PackageX, Tag, Loader2, Check, X, MessageSquareText } from 'lucide-react';
import clsx from 'clsx';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import { StorefrontPage, StorefrontCard } from '@/components/storefront';
import type { StorefrontSettings } from '@/api/storefront.api';
import sf from '@/components/storefront/storefront.module.css';
import styles from './storefrontCheckout.module.css';
import { storefrontCouponsApi, type CouponValidationResult } from '@/api/storefront-coupons.api';

export default function StorefrontCartPage() {
  const navigate = useNavigate();
  const prefix = storePrefix();
  const { settings } = useOutletContext<{ settings?: StorefrontSettings }>();
  const { items, updateQty, removeItem, totalPrice } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);

  if (settings?.hidePrices) {
    return (
      <StorefrontPage variant="medium">
        <StorefrontCard className={sf.emptyState}>
          <MessageSquareText size={56} className={sf.emptyIcon} style={{ color: '#25D366' }} />
          <h2 className={sf.emptyTitle}>Modo Catálogo Activo</h2>
          <p className={sf.emptyText}>
            Nuestra tienda opera en modalidad de catálogo con consultas directas vía WhatsApp. Las compras por carrito se encuentran deshabilitadas.
          </p>
          <Link to={`${prefix}/`} className="storefront-btn">
            Explorar Catálogo
          </Link>
        </StorefrontCard>
      </StorefrontPage>
    );
  }

  const handleRemove = (variantId: string, name: string) => {
    removeItem(variantId);
    toast.success(`${name} eliminado del carrito.`);
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const result = await storefrontCouponsApi.validate(code, subtotal);
      if (result.valid) {
        setAppliedCoupon(result);
        toast.success(result.message || 'Cupón aplicado ✓');
      } else {
        toast.error(result.message || 'Cupón inválido');
      }
    } catch {
      toast.error('No se pudo verificar el cupón. Intentá nuevamente.');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  if (items.length === 0) {
    return (
      <StorefrontPage variant="medium">
        <StorefrontCard className={sf.emptyState}>
          <PackageX size={56} className={sf.emptyIcon} />
          <h2 className={sf.emptyTitle}>Tu carrito está vacío</h2>
          <p className={sf.emptyText}>Explorá el catálogo para encontrar los mejores productos.</p>
          <Link to={`${prefix}/`} className="storefront-btn">
            Ver Catálogo
          </Link>
        </StorefrontCard>
      </StorefrontPage>
    );
  }

  const subtotal = totalPrice();
  const discount = appliedCoupon?.discountAmount ?? 0;
  const totalAfterDiscount = Math.max(0, subtotal - discount);

  return (
    <div className="storefront-checkout-container">
      <div className={sf.pageTitleRow}>
        <h1 className={sf.pageTitle}>Mi Carrito</h1>
        <Link to={`${prefix}/`} className={sf.linkBack}>← Seguir comprando</Link>
      </div>

      <div className="storefront-checkout-left">
        <div className={styles.panel}>
          {items.map((item) => (
            <div key={item.variantId} className={styles.cartItem}>
              <div className={styles.thumb}>
                <span className={styles.thumbLetter}>{item.name.charAt(0)}</span>
              </div>

              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{item.name}</p>
                <p className={styles.itemMeta}>
                  {item.sku}{item.size ? ` • T. ${item.size}` : ''}{item.color ? ` • ${item.color}` : ''}
                </p>
                <span className={styles.itemPrice}>{formatCurrency(item.price)}</span>
              </div>

              <div className={styles.itemControls}>
                <div className={styles.qtyControl}>
                  <button type="button" onClick={() => updateQty(item.variantId, item.qty - 1)} className={styles.qtyBtn}>−</button>
                  <div className={styles.qtyValue}>{item.qty}</div>
                  <button type="button" onClick={() => updateQty(item.variantId, item.qty + 1)} className={styles.qtyBtn}>+</button>
                </div>

                <div className={styles.subtotalCol}>
                  <span className={styles.subtotalValue}>{formatCurrency(item.price * item.qty)}</span>
                </div>

                <button type="button" onClick={() => handleRemove(item.variantId, item.name)} className={styles.removeBtn} title="Eliminar">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="storefront-checkout-right">
        <div className={clsx(styles.panel, styles.panelPadSm)}>
          <h3 className={styles.summaryTitleLg}>Resumen</h3>

          {/* Coupon / Gift Card input */}
          {!appliedCoupon ? (
            <div className={styles.couponRow}>
              <Tag size={15} className={styles.couponIcon} />
              <input
                className={clsx('storefront-input', styles.couponInput)}
                placeholder="Cupón o Gift Card"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
              />
              <button
                type="button"
                className={clsx('storefront-btn', styles.couponBtn)}
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
              >
                {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Aplicar'}
              </button>
            </div>
          ) : (
            <div className={styles.couponApplied}>
              <Check size={15} color="var(--green)" />
              <span className={styles.couponAppliedCode}>{appliedCoupon.code}</span>
              <span className={styles.couponAppliedSaving}>−{formatCurrency(discount)}</span>
              <button type="button" onClick={removeCoupon} className={styles.couponRemoveBtn} aria-label="Quitar cupón">
                <X size={13} />
              </button>
            </div>
          )}

          <div className={styles.totalRowLg}>
            <span>Subtotal ({items.reduce((a, i) => a + i.qty, 0)} artículos)</span>
            <span className={styles.totalRowValue}>{formatCurrency(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className={styles.totalRowLg}>
              <span style={{ color: 'var(--green)', fontWeight: 600 }}>Descuento aplicado</span>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>−{formatCurrency(discount)}</span>
            </div>
          )}

          <div className={styles.totalRowLg}>
            <span>Envío</span>
            <span className={styles.totalRowFree}>Calculado en checkout</span>
          </div>

          <div className={styles.totalsLg}>
            <div className={styles.grandTotalRow}>
              <span className={styles.grandTotalLabelLg}>Total</span>
              <span className={styles.grandTotalValueLg}>{formatCurrency(totalAfterDiscount)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const qs = appliedCoupon ? `?coupon=${encodeURIComponent(appliedCoupon.code!)}&discount=${discount}` : '';
              navigate(`${prefix}/checkout${qs}`);
            }}
            className="storefront-btn w-full"
          >
            Ir al Checkout <ArrowRight size={17} />
          </button>

          <p className={styles.secureHint}>
            🔒 Pago 100% seguro y encriptado
          </p>
        </div>
      </div>
    </div>
  );
}



