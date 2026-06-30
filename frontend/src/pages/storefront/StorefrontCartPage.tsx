import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, PackageX } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';

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
      <div style={{ maxWidth: '800px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div className="glass" style={{ padding: '64px' }}>
          <PackageX size={56} color="var(--text-muted)" style={{ margin: '0 auto 20px', display: 'block' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>Tu carrito está vacío</h2>
          <p style={{ margin: '0 0 28px', color: 'var(--text-secondary)' }}>Explorá el catálogo para encontrar los mejores productos.</p>
          <Link to={`${prefix}/`} className="storefront-btn">
            Ver Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = totalPrice();

  return (
    <div className="storefront-checkout-container">
      
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: 'var(--text-primary)' }}>Mi Carrito</h1>
        <Link to={`${prefix}/`} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Seguir comprando</Link>
      </div>

      {/* Items list */}
      <div className="storefront-checkout-left">
        <div className="glass" style={{ overflow: 'hidden' }}>
          {items.map((item, idx) => (
            <div key={item.variantId} style={{ padding: '20px 24px', borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              
              {/* Thumbnail */}
              <div style={{ width: '68px', height: '68px', background: 'var(--bg-overlay)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '28px', color: 'var(--text-muted)', fontWeight: 900 }}>{item.name.charAt(0)}</span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: '120px' }}>
                <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  {item.sku}{item.size ? ` • T. ${item.size}` : ''}{item.color ? ` • ${item.color}` : ''}
                </p>
                <span style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)' }}>{formatCurrency(item.price)}</span>
              </div>

              {/* Controls Wrapper for mobile wrap */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
                {/* Qty stepper */}
                <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-overlay)' }}>
                  <button onClick={() => updateQty(item.variantId, item.qty - 1)} style={{ padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>−</button>
                  <div style={{ width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, background: 'var(--bg-surface)', fontSize: '14px', color: 'var(--text-primary)' }}>{item.qty}</div>
                  <button onClick={() => updateQty(item.variantId, item.qty + 1)} style={{ padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>+</button>
                </div>

                {/* Subtotal */}
                <div style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontWeight: 900, fontSize: '15px', color: 'var(--text-primary)' }}>{formatCurrency(item.price * item.qty)}</span>
                </div>

                {/* Remove */}
                <button onClick={() => handleRemove(item.variantId, item.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--red)', flexShrink: 0 }} title="Eliminar">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary sidebar */}
      <div className="storefront-checkout-right">
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>Resumen</h3>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <span>Subtotal ({items.reduce((a, i) => a + i.qty, 0)} artículos)</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
            <span>Envío</span>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>Calculado en checkout</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '2px solid var(--border)', marginBottom: '20px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Total</span>
            <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)' }}>{formatCurrency(subtotal)}</span>
          </div>

          <button
            onClick={() => navigate(`${prefix}/checkout`)}
            className="storefront-btn w-full"
          >
            Ir al Checkout <ArrowRight size={17} />
          </button>

          <p style={{ margin: '14px 0 0', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            🔒 Pago 100% seguro y encriptado
          </p>
        </div>
      </div>

    </div>
  );
}
