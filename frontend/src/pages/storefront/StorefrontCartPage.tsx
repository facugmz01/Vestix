import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, PackageX } from 'lucide-react';
import clsx from 'clsx';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import { StorefrontPage, StorefrontCard } from '@/components/storefront';
import sf from '@/components/storefront/storefront.module.css';
import styles from './storefrontCheckout.module.css';

export default function StorefrontCartPage() {
  const navigate = useNavigate();
  const prefix = storePrefix();
  const { items, updateQty, removeItem, totalPrice } = useCartStore();

  const handleRemove = (variantId: string, name: string) => {
    removeItem(variantId);
    toast.success(`${name} eliminado del carrito.`);
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

          <div className={styles.totalRowLg}>
            <span>Subtotal ({items.reduce((a, i) => a + i.qty, 0)} artículos)</span>
            <span className={styles.totalRowValue}>{formatCurrency(subtotal)}</span>
          </div>
          <div className={styles.totalRowLg}>
            <span>Envío</span>
            <span className={styles.totalRowFree}>Calculado en checkout</span>
          </div>

          <div className={styles.totalsLg}>
            <div className={styles.grandTotalRow}>
              <span className={styles.grandTotalLabelLg}>Total</span>
              <span className={styles.grandTotalValueLg}>{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`${prefix}/checkout`)}
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
