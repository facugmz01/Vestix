import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, PackageX } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';
import toast from 'react-hot-toast';

export default function StorefrontCartPage() {
  const navigate = useNavigate();
  const prefix = storePrefix();
  const { items, updateQty, removeItem, totalPrice } = useCartStore();

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const handleRemove = (variantId: string, name: string) => {
    removeItem(variantId);
    toast.success(`${name} eliminado del carrito.`);
  };

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: '800px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ padding: '64px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <PackageX size={56} color="#cbd5e1" style={{ margin: '0 auto 20px', display: 'block' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>Tu carrito está vacío</h2>
          <p style={{ margin: '0 0 28px', color: '#64748b' }}>Explorá el catálogo para encontrar los mejores productos.</p>
          <Link to={`${prefix}/`} style={{ display: 'inline-block', background: '#3b82f6', color: '#fff', padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 800, fontSize: '15px' }}>
            Ver Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = totalPrice();

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>Mi Carrito</h1>
        <Link to={`${prefix}/`} style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>← Seguir comprando</Link>
      </div>

      <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Items list */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {items.map((item, idx) => (
              <div key={item.variantId} style={{ padding: '20px 24px', borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: '16px' }}>
                
                {/* Thumbnail */}
                <div style={{ width: '68px', height: '68px', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '28px', color: '#cbd5e1', fontWeight: 900 }}>{item.name.charAt(0)}</span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 3px', fontWeight: 700, fontSize: '15px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {item.sku}{item.size ? ` • T. ${item.size}` : ''}{item.color ? ` • ${item.color}` : ''}
                  </p>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{fmtCurrency(item.price)}</span>
                </div>

                {/* Qty stepper */}
                <div style={{ display: 'inline-flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                  <button onClick={() => updateQty(item.variantId, item.qty - 1)} style={{ padding: '6px 12px', border: 'none', background: '#f8fafc', cursor: 'pointer', fontWeight: 800, fontSize: '16px', color: '#475569' }}>−</button>
                  <div style={{ width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, background: '#fff', fontSize: '14px' }}>{item.qty}</div>
                  <button onClick={() => updateQty(item.variantId, item.qty + 1)} style={{ padding: '6px 12px', border: 'none', background: '#f8fafc', cursor: 'pointer', fontWeight: 800, fontSize: '16px', color: '#475569' }}>+</button>
                </div>

                {/* Subtotal */}
                <div style={{ width: '90px', textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontWeight: 900, fontSize: '15px', color: '#0f172a' }}>{fmtCurrency(item.price * item.qty)}</span>
                </div>

                {/* Remove */}
                <button onClick={() => handleRemove(item.variantId, item.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#ef4444', flexShrink: 0 }} title="Eliminar">
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Summary sidebar */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>Resumen</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#475569', fontSize: '14px' }}>
              <span>Subtotal ({items.reduce((a, i) => a + i.qty, 0)} artículos)</span>
              <span style={{ fontWeight: 600 }}>{fmtCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: '#475569', fontSize: '14px' }}>
              <span>Envío</span>
              <span style={{ color: '#22c55e', fontWeight: 600 }}>Calculado en checkout</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '2px solid #f1f5f9', marginBottom: '20px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800 }}>Total</span>
              <span style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a' }}>{fmtCurrency(subtotal)}</span>
            </div>

            <button
              onClick={() => navigate(`${prefix}/checkout`)}
              style={{ width: '100%', padding: '15px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Ir al Checkout <ArrowRight size={17} />
            </button>

            <p style={{ margin: '14px 0 0', fontSize: '12px', color: '#94a3b8', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              🔒 Pago 100% seguro y encriptado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
