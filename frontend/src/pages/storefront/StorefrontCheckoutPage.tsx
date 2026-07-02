import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { CheckCircle, Truck, Store, CreditCard, User, Loader2 } from 'lucide-react';
import { storefrontOrdersApi, type CheckoutDto } from '@/api/storefront-orders.api';
import { storefrontApi } from '@/api/storefront.api';
import { useCartStore } from '@/store/cart.store';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import { useStorefrontAuthStore } from '@/store/storefrontAuth.store';
import { storePrefix } from '@/utils/storefrontDomain';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';

export default function StorefrontCheckoutPage() {
  const navigate = useNavigate();
  const prefix = storePrefix();
  const queryClient = useQueryClient();
  const { items, totalPrice, clearCart } = useCartStore();
  const enqueueOfflineOp = useOfflineQueueStore(s => s.enqueue);

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['storefrontSettings', prefix],
    queryFn: () => storefrontApi.getSettings(),
  });

  const { customer, isAuthenticated } = useStorefrontAuthStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [info, setInfo] = useState({ firstName: '', lastName: '', email: '', phone: '', docType: 'DNI', docNum: '' });
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [issueInvoice, setIssueInvoice] = useState(false);

  useEffect(() => {
    if (isAuthenticated && customer) {
      setInfo(prev => ({
        ...prev,
        firstName: customer.firstName || (customer.fullName ? customer.fullName.split(' ')[0] : prev.firstName),
        lastName: customer.lastName || (customer.fullName && customer.fullName.split(' ').length > 1 ? customer.fullName.split(' ').slice(1).join(' ') : prev.lastName),
        email: customer.email || prev.email,
        phone: customer.phone || prev.phone,
        docType: customer.documentType || prev.docType,
        docNum: customer.documentNumber || prev.docNum,
      }));
    }
  }, [isAuthenticated, customer]);

  useEffect(() => {
    if (settings?.shippingMethods?.length && !shippingMethod) {
      setShippingMethod(settings.shippingMethods[0].id);
    }
    if (settings?.paymentMethods?.length && !paymentMethod) {
      setPaymentMethod(settings.paymentMethods[0].id);
    }
  }, [settings, shippingMethod, paymentMethod]);

  const selectedShipping = settings?.shippingMethods?.find(m => m.id === shippingMethod);
  const SHIPPING_COST = selectedShipping ? selectedShipping.price : 0;
  
  const subtotal = totalPrice();
  const grandTotal = subtotal + SHIPPING_COST;

  if (isLoadingSettings) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><Loader2 size={32} className="spin" color="var(--accent)" /></div>;
  }

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
          description: `Pedido online offline por ${formatCurrency(grandTotal)}`,
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
            description: `Pedido online offline por ${formatCurrency(grandTotal)}`,
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
      // Invalidate catalogs and history optimistically
      queryClient.invalidateQueries({ queryKey: ['storefront'] });

      if (data?.offline) {
        toast.success('Pedido registrado fuera de línea (sincronizará cuando haya conexión) 💾');
        setStep(4);
      } else if (data?.payment?.initPoint) {
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
        method: shippingMethod as 'SHIPPING' | 'PICKUP',
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
      issueInvoice,
    });
  };

  if (step === 4) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '48px 32px', textAlign: 'center' }}>
        <div className="glass" style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--green-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle size={48} color="var(--green)" />
          </div>
          <h1 style={{ margin: '0 0 12px', fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)' }}>¡Gracias por tu compra!</h1>
          <p style={{ margin: '0 0 32px', color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6 }}>
            Tu pedido fue procesado exitosamente. Te enviamos un comprobante a <strong>{info.email || 'tu correo'}</strong>.
          </p>
          <button
            onClick={() => navigate(`${prefix}/my-orders`)}
            className="storefront-btn"
          >
            Ver Estado de mi Pedido
          </button>
        </div>
      </div>
    );
  }

  const steps = ['Datos', 'Envío', 'Pago'];

  return (
    <div className="storefront-checkout-container">

      {/* Left: Form */}
      <div className="storefront-checkout-left">
        
        {/* Progress steps */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', height: '2px', background: 'var(--border)', zIndex: 0 }} />
          {steps.map((label, idx) => {
            const s = idx + 1;
            const active = step >= s;
            return (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: active ? 'var(--accent)' : 'var(--bg-surface)', color: active ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '6px', border: active ? 'none' : '2px solid var(--border)', fontSize: '14px', transition: 'all 0.3s' }}>
                  {s}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: active ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
              </div>
            );
          })}
        </div>

        <div className="glass" style={{ overflow: 'hidden' }}>

          {/* Step 1: Personal info */}
          {step === 1 && (
            <div className="animate-fade" style={{ padding: '28px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}><User size={18} /> Datos del Comprador</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <input className="storefront-input" placeholder="Nombre *" value={info.firstName} onChange={e => setInfo({...info, firstName: e.target.value})} />
                <input className="storefront-input" placeholder="Apellido" value={info.lastName} onChange={e => setInfo({...info, lastName: e.target.value})} />
                <input className="storefront-input" placeholder="Correo Electrónico *" type="email" value={info.email} onChange={e => setInfo({...info, email: e.target.value})} style={{ gridColumn: 'span 2' }} />
                <input className="storefront-input" placeholder="Teléfono" value={info.phone} onChange={e => setInfo({...info, phone: e.target.value})} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select className="storefront-input" value={info.docType} onChange={e => setInfo({...info, docType: e.target.value})} style={{ width: '90px' }}>
                    <option>DNI</option><option>CUIT</option>
                  </select>
                  <input className="storefront-input" placeholder="Número" value={info.docNum} onChange={e => setInfo({...info, docNum: e.target.value})} style={{ flex: 1 }} />
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)' }}>
                    <input 
                      type="checkbox" 
                      checked={issueInvoice} 
                      onChange={e => setIssueInvoice(e.target.checked)} 
                      style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }} 
                    />
                    Solicitar Factura Electrónica (AFIP)
                  </label>
                  <p style={{ margin: '4px 0 0 24px', fontSize: '12px', color: 'var(--text-secondary)' }}>Si no lo marcas, se emitirá un recibo de uso interno.</p>
                </div>
              </div>
              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button onClick={() => setStep(2)} className="storefront-btn">Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 2: Shipping */}
          {step === 2 && (
            <div className="animate-fade" style={{ padding: '28px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}><Truck size={18} /> Opciones de Entrega</h2>
              <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {(settings?.shippingMethods || []).map(opt => {
                  const selected = shippingMethod === opt.id;
                  const Icon = opt.type === 'SHIPPING' ? Truck : Store;
                  return (
                    <div key={opt.id} onClick={() => setShippingMethod(opt.id)} style={{ flex: 1, minWidth: '140px', padding: '16px', border: selected ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', background: selected ? 'var(--accent-subtle)' : 'var(--bg-overlay)', transition: 'all 0.2s' }}>
                      <Icon size={22} color={selected ? 'var(--accent)' : 'var(--text-muted)'} style={{ marginBottom: '8px' }} />
                      <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{opt.name}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: selected ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {opt.price === 0 ? 'Gratis' : `+ ${formatCurrency(opt.price)}`}
                      </p>
                    </div>
                  );
                })}
              </div>
              {selectedShipping?.type === 'SHIPPING' && settings?.requireShippingData !== 'none' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <input className="storefront-input" placeholder="Calle y Número" value={shippingAddress.street} onChange={e => setShippingAddress({...shippingAddress, street: e.target.value})} style={{ gridColumn: 'span 2' }} />
                  <input className="storefront-input" placeholder="Ciudad" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="storefront-input" placeholder="Provincia" value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} style={{ flex: 2 }} />
                    <input className="storefront-input" placeholder="C.P." value={shippingAddress.zip} onChange={e => setShippingAddress({...shippingAddress, zip: e.target.value})} style={{ flex: 1 }} />
                  </div>
                </div>
              )}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(1)} className="storefront-btn storefront-btn-secondary">← Volver</button>
                <button onClick={() => setStep(3)} className="storefront-btn">Continuar →</button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="animate-fade" style={{ padding: '28px' }}>
              <h2 style={{ margin: '0 0 20px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}><CreditCard size={18} /> Pago Seguro</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {(settings?.paymentMethods || []).map(pm => (
                  <label key={pm.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', border: paymentMethod === pm.id ? '2px solid var(--accent)' : '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', background: paymentMethod === pm.id ? 'var(--accent-subtle)' : 'var(--bg-overlay)' }}>
                    <input type="radio" checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} style={{ accentColor: 'var(--accent)' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{pm.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{pm.type === 'CREDIT_CARD' ? 'Mercado Pago' : pm.type}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(2)} className="storefront-btn storefront-btn-secondary">← Volver</button>
                <button onClick={handleCheckout} disabled={mutation.isPending} className="storefront-btn" style={{ minWidth: '180px' }}>
                  {mutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Procesando...</> : '✓ Confirmar Pedido'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Order summary */}
      <div className="storefront-checkout-right">
        <div className="glass" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Tu pedido</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {items.map(i => (
              <div key={i.variantId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{ flex: 1, paddingRight: '8px' }}>{i.name} {i.size ? `(T.${i.size})` : ''} × {i.qty}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>{formatCurrency(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span><span style={{ fontWeight: 600 }}>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>Envío</span>
              <span style={{ fontWeight: 600, color: SHIPPING_COST === 0 ? 'var(--green)' : 'var(--text-primary)' }}>
                {SHIPPING_COST === 0 ? 'GRATIS' : formatCurrency(SHIPPING_COST)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid var(--border)' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-primary)' }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
