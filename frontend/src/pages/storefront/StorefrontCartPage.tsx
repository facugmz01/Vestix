import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StorefrontCartPage() {
  const navigate = useNavigate();
  
  // Mock Cart State
  const [cartItems, setCartItems] = useState([
    { id: '1', sku: 'NIKE-AF1-WHT-42', name: 'Nike Air Force 1', price: 45000, qty: 1 },
    { id: '2', sku: 'ADIDAS-SST-BLK-M', name: 'Remera Adidas Superstar', price: 18000, qty: 2 },
  ]);

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return;
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const removeLine = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
    toast.success('Producto removido');
  };

  const subtotal = cartItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
      
      <h1 style={{ margin: '0 0 32px', fontSize: '32px', fontWeight: 900, color: '#0f172a' }}>Mi Carrito</h1>

      {cartItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <ShoppingCart size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: '20px' }}>Tu carrito está vacío</h2>
          <p style={{ margin: '0 0 24px', color: '#64748b' }}>Explora nuestro catálogo para encontrar los mejores productos.</p>
          <Link to="/store" style={{ display: 'inline-block', background: '#3b82f6', color: '#fff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 800 }}>Volver a la Tienda</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          
          <div style={{ flex: 1, background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc', textAlign: 'left', fontSize: '13px', color: '#475569' }}>
                  <th style={{ padding: '16px 24px' }}>Producto</th>
                  <th style={{ padding: '16px 24px' }}>Precio</th>
                  <th style={{ padding: '16px 24px' }}>Cantidad</th>
                  <th style={{ padding: '16px 24px' }}>Subtotal</th>
                  <th style={{ padding: '16px 24px' }}></th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '64px', height: '64px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '24px', color: '#cbd5e1', fontWeight: 900 }}>{item.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '15px' }}>{item.name}</p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '24px', fontWeight: 600 }}>{fmtCurrency(item.price)}</td>
                    <td style={{ padding: '24px' }}>
                      <div style={{ display: 'inline-flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                        <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ padding: '6px 12px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 800 }}>-</button>
                        <div style={{ width: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, background: '#fff', fontSize: '14px' }}>{item.qty}</div>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ padding: '6px 12px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 800 }}>+</button>
                      </div>
                    </td>
                    <td style={{ padding: '24px', fontWeight: 900, fontSize: '16px', color: '#0f172a' }}>{fmtCurrency(item.price * item.qty)}</td>
                    <td style={{ padding: '24px', textAlign: 'right' }}>
                      <Trash2 size={18} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => removeLine(item.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ width: '350px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800 }}>Resumen de Compra</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#475569' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{fmtCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', color: '#475569' }}>
              <span>Envío</span>
              <span>Calculado en Checkout</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800 }}>Total a Pagar</span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{fmtCurrency(subtotal)}</span>
            </div>

            <button 
              onClick={() => navigate('/store/checkout')}
              style={{ width: '100%', padding: '16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Iniciar Checkout <ArrowRight size={18} />
            </button>

            <p style={{ margin: '16px 0 0', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
              Pago seguro y encriptado.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
