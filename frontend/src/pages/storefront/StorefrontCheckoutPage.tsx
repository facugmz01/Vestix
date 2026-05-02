import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, Truck, Store, CreditCard, User } from 'lucide-react';
import { storefrontOrdersApi, type CheckoutDto } from '@/api/storefront-orders.api';
import toast from 'react-hot-toast';

export default function StorefrontCheckoutPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [info, setInfo] = useState({ firstName: '', lastName: '', email: '', phone: '', docType: 'DNI', docNum: '' });
  const [shippingMethod, setShippingMethod] = useState<'SHIPPING' | 'PICKUP'>('SHIPPING');
  const [shippingAddress, setShippingAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [paymentMethod, setPaymentMethod] = useState('MERCADOPAGO');

  const mutation = useMutation({
    mutationFn: (data: CheckoutDto) => storefrontOrdersApi.checkout(data),
    onSuccess: () => {
      setStep(4); // Success step
    },
    onError: (err: any) => toast.error(err.message || 'Error al procesar el pago. Intente nuevamente.'),
  });

  const handleCheckout = () => {
    // Mocking cart items
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
      cartLines: [{ variantId: '1', quantity: 1, price: 45000 }],
    });
  };

  if (step === 4) {
    return (
      <div style={{ maxWidth: '600px', margin: '64px auto', padding: '48px 32px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
        <CheckCircle size={64} color="#22c55e" style={{ margin: '0 auto 24px' }} />
        <h1 style={{ margin: '0 0 12px', fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>¡Gracias por tu compra!</h1>
        <p style={{ margin: '0 0 32px', color: '#475569', fontSize: '16px', lineHeight: 1.5 }}>
          Tu pedido ha sido procesado exitosamente. Te enviamos un comprobante a <strong>{info.email || 'tu correo'}</strong> con los detalles.
        </p>
        <button 
          onClick={() => navigate('/store/my-orders')}
          style={{ padding: '14px 28px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}
        >
          Ver Estado de mi Pedido
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '48px auto', padding: '0 24px' }}>
      
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '48px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '16px', left: '0', right: '0', height: '2px', background: '#e2e8f0', zIndex: 0 }} />
        
        {['Datos Personales', 'Envío', 'Pago'].map((label, idx) => {
          const s = idx + 1;
          const active = step >= s;
          return (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: active ? '#0f172a' : '#f1f5f9', color: active ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, marginBottom: '8px', border: active ? 'none' : '2px solid #e2e8f0' }}>
                {s}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: active ? '#0f172a' : '#94a3b8' }}>{label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {step === 1 && (
          <div style={{ padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={20} /> Datos del Comprador</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <input placeholder="Nombre" value={info.firstName} onChange={e => setInfo({...info, firstName: e.target.value})} style={inputStyle} />
              <input placeholder="Apellido" value={info.lastName} onChange={e => setInfo({...info, lastName: e.target.value})} style={inputStyle} />
              <input placeholder="Correo Electrónico" type="email" value={info.email} onChange={e => setInfo({...info, email: e.target.value})} style={{ ...inputStyle, gridColumn: 'span 2' }} />
              <input placeholder="Teléfono" value={info.phone} onChange={e => setInfo({...info, phone: e.target.value})} style={inputStyle} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={info.docType} onChange={e => setInfo({...info, docType: e.target.value})} style={{ ...inputStyle, width: '100px' }}>
                  <option>DNI</option><option>CUIT</option>
                </select>
                <input placeholder="Número" value={info.docNum} onChange={e => setInfo({...info, docNum: e.target.value})} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
            <div style={{ marginTop: '32px', textAlign: 'right' }}>
              <button onClick={() => setStep(2)} style={btnStyle}>Continuar al Envío</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={20} /> Opciones de Entrega</h2>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div onClick={() => setShippingMethod('SHIPPING')} style={{ flex: 1, padding: '16px', border: shippingMethod === 'SHIPPING' ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', background: shippingMethod === 'SHIPPING' ? '#eff6ff' : '#fff' }}>
                <Truck size={24} color={shippingMethod === 'SHIPPING' ? '#3b82f6' : '#64748b'} style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px' }}>Envío a Domicilio</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Despacho por correo</p>
              </div>
              <div onClick={() => setShippingMethod('PICKUP')} style={{ flex: 1, padding: '16px', border: shippingMethod === 'PICKUP' ? '2px solid #3b82f6' : '1px solid #cbd5e1', borderRadius: '12px', cursor: 'pointer', background: shippingMethod === 'PICKUP' ? '#eff6ff' : '#fff' }}>
                <Store size={24} color={shippingMethod === 'PICKUP' ? '#3b82f6' : '#64748b'} style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px' }}>Retiro en Local</h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Gratis en sucursal centro</p>
              </div>
            </div>

            {shippingMethod === 'SHIPPING' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input placeholder="Calle y Número" value={shippingAddress.street} onChange={e => setShippingAddress({...shippingAddress, street: e.target.value})} style={{ ...inputStyle, gridColumn: 'span 2' }} />
                <input placeholder="Ciudad" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} style={inputStyle} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input placeholder="Provincia" value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} style={{ ...inputStyle, flex: 2 }} />
                  <input placeholder="C.P." value={shippingAddress.zip} onChange={e => setShippingAddress({...shippingAddress, zip: e.target.value})} style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
            )}

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ ...btnStyle, background: '#f1f5f9', color: '#0f172a' }}>Volver</button>
              <button onClick={() => setStep(3)} style={btnStyle}>Continuar al Pago</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ padding: '32px' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={20} /> Pago Seguro</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>
                <input type="radio" checked={paymentMethod === 'MERCADOPAGO'} onChange={() => setPaymentMethod('MERCADOPAGO')} />
                <span style={{ fontWeight: 600 }}>Mercado Pago</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b' }}>Tarjetas y Saldo</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>
                <input type="radio" checked={paymentMethod === 'BANK_TRANSFER'} onChange={() => setPaymentMethod('BANK_TRANSFER')} />
                <span style={{ fontWeight: 600 }}>Transferencia Bancaria</span>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#64748b' }}>10% Descuento</span>
              </label>
            </div>

            <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#475569' }}>Total Carrito</span>
                <span style={{ fontWeight: 600 }}>$ 81.000,00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <span style={{ color: '#475569' }}>Costo de Envío</span>
                <span style={{ fontWeight: 600 }}>{shippingMethod === 'PICKUP' ? 'GRATIS' : '$ 3.500,00'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '18px', fontWeight: 800 }}>Total Final</span>
                <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{shippingMethod === 'PICKUP' ? '$ 81.000,00' : '$ 84.500,00'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} style={{ ...btnStyle, background: '#f1f5f9', color: '#0f172a' }}>Volver</button>
              <button onClick={handleCheckout} style={{ ...btnStyle, background: '#10b981', color: '#fff' }}>
                {mutation.isPending ? 'Procesando...' : 'Pagar y Finalizar Compra'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '14px',
  outline: 'none',
  background: '#f8fafc'
};

const btnStyle = {
  padding: '14px 28px',
  background: '#0f172a',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 800,
  cursor: 'pointer'
};
