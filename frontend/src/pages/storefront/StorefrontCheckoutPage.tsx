import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, Truck, Store, CreditCard, User } from 'lucide-react';
import { storefrontOrdersApi, type CheckoutDto } from '@/api/storefront-orders.api';
import { useCartStore } from '@/store/cart.store';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import { storePrefix } from '@/utils/storefrontDomain';
import toast from 'react-hot-toast';

export default function StorefrontCheckoutPage() {
  const navigate = useNavigate();
  const prefix = storePrefix();
  const { items, totalPrice, clearCart } = useCartStore();
  const enqueueOfflineOp = useOfflineQueueStore(s => s.enqueue);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [info, setInfo] = useState({ firstName: '', lastName: '', email: '', phone: '', docType: 'DNI', docNum: '' });
  const [shippingMethod, setShippingMethod] = useState<'SHIPPING' | 'PICKUP'>('SHIPPING');
  const [shippingAddress, setShippingAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [paymentMethod, setPaymentMethod] = useState('MERCADOPAGO');

  const SHIPPING_COST = shippingMethod === 'PICKUP' ? 0 : 3500;
  const subtotal = totalPrice();
  const grandTotal = subtotal + SHIPPING_COST;
  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  // Redirect to cart if empty
  if (items.length === 0 && step !== 4) {
    navigate(`${prefix}/cart`);
    return null;
  }

  const mutation = useMutation({
    mutationFn: async (data: CheckoutDto) => {
      const orderId = data.id || crypto.randomUUID();
      const payload = { ...data, id: orderId };

      if (!navigator.onLine) {
        enqueueOfflineOp({
          module: 'STOREFRONT',
          action: 'checkout',
          description: `Pedido online offline por ${fmtCurrency(grandTotal)}`,
          endpoint: '/storefront/checkout',
          method: 'POST',
          maxRetries: 5,
          payload
        });
        return { offline: true, orderId, payment: null };
      }

      try {
        const res = await storefrontOrdersApi.checkout(payload);
        return { offline: false, res, payment: (res as any).payment };
      } catch (err: any) {
        const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error');
        if (isNetworkError) {
          enqueueOfflineOp({
            module: 'STOREFRONT',
            action: 'checkout',
            description: `Pedido online offline por ${fmtCurrency(grandTotal)}`,
            endpoint: '/storefront/checkout',
            method: 'POST',
            maxRetries: 5,
            payload
          });
          return { offline: true, orderId, payment: null };
        }
        throw err;
      }
    },
    onSuccess: (data: any) => {
      clearCart();
      if (data?.offline) {
        toast.success('Pedido registrado fuera de línea (sincronizará cuando haya conexión) 💾');
        setStep(4);
      } else if (data?.payment?.initPoint) {
        // ── Redirect to MercadoPago Checkout Pro ──
        toast.success('Redirigiendo a Mercado Pago...');
        window.location.href = data.payment.initPoint;
      } else {
        toast.success('¡Pedido registrado! ✅');
        setStep(4);
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al procesar el pedido. Intente nuevamente.'),
  });

  const handleCheckout = () => {
    if (!info.firstName || !info.email) {
      toast.error('Completá nombre y correo para continuar.');
      setStep(1);
      return;
    }
    mutation.mutate({
      customerInfo: {
        firstName: info.firstName,
        lastName: info.lastName,
        email: info.email,
        phone: info.phone,
        documentType: info.docType,
        documentNumber: info.docNum,
      },
      shippingInfo: {
        method: shippingMethod,
        address: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zip,
      },
      paymentMethod,
      cartLines: items.map(i => ({
        variantId: i.variantId,
        quantity: i.qty,
        price: i.price,
      })),
    });
  };

  if (step === 4) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '48px 32px', background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '80px', height: '80px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <CheckCircle size={48} color="#22c55e" />
        </div>
        <h1 style={{ margin: '0 0 12px', fontSize: '26px', fontWeight: 900, color: '#0f172a' }}>¡Gracias por tu compra!</h1>
        <p style={{ margin: '0 0 32px', color: '#475569', fontSize: '15px', lineHeight: 1.6 }}>
          Tu pedido fue procesado exitosamente. Te enviamos un comprobante a <strong>{info.email || 'tu correo'}</strong>.
        </p>
        <button
          onClick={() => navigate(`${prefix}/my-orders`)}
          style={{ padding: '14px 28px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}
        >
          Ver Estado de mi Pedido
        </button>
      </div>
    );
  }

  const steps = ['Datos', 'Envío', 'Pago'];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px', display: 'flex', gap: '28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* Left: Form */}
      <div style={{ flex: 1, minWidth: '300px' }}>
        
        {/* Progress steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', height: '2px', background: '#e2e8f0', zIndex: 0 }} />
          {steps.map((label, idx) => {
            const s = idx + 1;
            const active = step >= s;
            return (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: active ? '#0f172a' : '#f1f5f9', color: active ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '6px', border: active ? 'none' : '2px solid #e2e8f0', fontSize: '14px' }}>
                  {s}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: active ? '#0f172a' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

          {/* Step 1: Personal info */}
          {step === 1 && (
            <div style={{ padding: '28px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={18} /> Datos del Comprador</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <input placeholder="Nombre *" value={info.firstName} onChange={e => setInfo({...info, firstName: e.target.value})} style={inputStyle} />
                <input placeholder="Apellido" value={info.lastName} onChange={e => setInfo({...info, lastName: e.target.value})} style={inputStyle} />
                <input placeholder="Correo Electrónico *" type="email" value={info.email} onChange={e => setInfo({...info, email: e.target.value})} style={{ ...inputStyle, gridColumn: 'span 2' }} />
                <input placeholder="Teléfono" value={info.phone} onChange={e => setInfo({...info, phone: e.target.value})} style={inputStyle} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={info.docType} onChange={e => setInfo({...info, docType: e.target.value})} style={{ ...inputStyle, width: '90px' }}>
                    <option>DNI</option><option>CUIT</option>
                  </select>
                  <input placeholder="Número" value={info.docNum} onChange={e => setInfo({...info, docNum: e.target.value})} style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button onClick={() => setStep(2)} style={btnStyle}>Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div style={{ padding: '28px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={18} /> Opciones de Entrega</h2>
              <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
                {[{ id: 'SHIPPING', icon: Truck, label: 'Envío a Domicilio', sub: `+ ${fmtCurrency(3500)}` }, { id: 'PICKUP', icon: Store, label: 'Retiro en Local', sub: 'Gratis' }].map(opt => {
                  const selected = shippingMethod === opt.id;
                  return (
                    <div key={opt.id} onClick={() => setShippingMethod(opt.id as any)} style={{ flex: 1, padding: '16px', border: selected ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', background: selected ? '#eff6ff' : '#fff' }}>
                      <opt.icon size={22} color={selected ? '#3b82f6' : '#94a3b8'} style={{ marginBottom: '8px' }} />
                      <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: selected ? '#1d4ed8' : '#0f172a' }}>{opt.label}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: selected ? '#3b82f6' : '#64748b', fontWeight: 600 }}>{opt.sub}</p>
                    </div>
                  );
                })}
              </div>
              {shippingMethod === 'SHIPPING' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <input placeholder="Calle y Número" value={shippingAddress.street} onChange={e => setShippingAddress({...shippingAddress, street: e.target.value})} style={{ ...inputStyle, gridColumn: 'span 2' }} />
                  <input placeholder="Ciudad" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} style={inputStyle} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input placeholder="Provincia" value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} style={{ ...inputStyle, flex: 2 }} />
                    <input placeholder="C.P." value={shippingAddress.zip} onChange={e => setShippingAddress({...shippingAddress, zip: e.target.value})} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                </div>
              )}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(1)} style={{ ...btnStyle, background: '#f1f5f9', color: '#0f172a' }}>← Volver</button>
                <button onClick={() => setStep(3)} style={btnStyle}>Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div style={{ padding: '28px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={18} /> Pago Seguro</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {[
                  { id: 'MERCADOPAGO', label: 'Mercado Pago', sub: 'Tarjetas, saldo y cuotas' },
                  { id: 'BANK_TRANSFER', label: 'Transferencia Bancaria', sub: '10% de descuento' },
                ].map(pm => (
                  <label key={pm.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: paymentMethod === pm.id ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', background: paymentMethod === pm.id ? '#eff6ff' : '#fff' }}>
                    <input type="radio" checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} style={{ accentColor: '#3b82f6' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>{pm.label}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{pm.sub}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(2)} style={{ ...btnStyle, background: '#f1f5f9', color: '#0f172a' }}>← Volver</button>
                <button onClick={handleCheckout} disabled={mutation.isPending} style={{ ...btnStyle, background: '#10b981', minWidth: '180px' }}>
                  {mutation.isPending ? 'Procesando...' : '✓ Confirmar Pedido'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Order summary */}
      <div style={{ width: '280px', flexShrink: 0 }}>
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Tu pedido</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {items.map(i => (
              <div key={i.variantId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                <span style={{ flex: 1, paddingRight: '8px' }}>{i.name} {i.size ? `(T.${i.size})` : ''} × {i.qty}</span>
                <span style={{ fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>{fmtCurrency(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
              <span>Subtotal</span><span style={{ fontWeight: 600 }}>{fmtCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
              <span>Envío</span>
              <span style={{ fontWeight: 600, color: SHIPPING_COST === 0 ? '#22c55e' : '#0f172a' }}>
                {SHIPPING_COST === 0 ? 'GRATIS' : fmtCurrency(SHIPPING_COST)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid #f1f5f9' }}>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: '18px', color: '#0f172a' }}>{fmtCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: '8px',
  border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none',
  background: '#f8fafc', boxSizing: 'border-box'
};

const btnStyle: React.CSSProperties = {
  padding: '12px 24px', background: '#0f172a', color: '#fff',
  border: 'none', borderRadius: '8px', fontSize: '14px',
  fontWeight: 800, cursor: 'pointer'
};
