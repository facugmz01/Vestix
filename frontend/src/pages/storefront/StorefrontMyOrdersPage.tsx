import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { storefrontOrdersApi } from '@/api/storefront-orders.api';
import { queryKeys } from '@/api/queryKeys';

export default function StorefrontMyOrdersPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Use page=1 for simplicity, you can add pagination
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.storefront.myOrders(),
    queryFn: () => storefrontOrdersApi.getMyOrders(1, 20),
  });

  const orders = data?.data || [];
  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const getStatusDisplay = (s: string) => {
    switch(s) {
      case 'PENDING_PAYMENT': return { label: 'Pendiente de Pago', color: '#f59e0b', icon: Clock };
      case 'PAID': return { label: 'Pagado - Preparando', color: '#3b82f6', icon: Package };
      case 'SHIPPED': return { label: 'En Camino', color: '#8b5cf6', icon: Truck };
      case 'DELIVERED': return { label: 'Entregado', color: '#22c55e', icon: CheckCircle };
      default: return { label: s, color: '#64748b', icon: Package };
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '48px auto', padding: '0 24px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      
      {/* Sidebar: List */}
      <div style={{ width: '400px', flexShrink: 0 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: '28px', fontWeight: 900 }}>Mis Compras</h1>
        
        {isLoading ? (
          <div>Cargando historial...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '32px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Package size={32} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
            <p style={{ margin: 0, color: '#64748b' }}>Aún no has realizado compras.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orders.map(o => {
              const statusInfo = getStatusDisplay(o.status);
              const isSelected = selectedId === o.id;
              return (
                <div 
                  key={o.id} 
                  onClick={() => setSelectedId(o.id)}
                  style={{ 
                    padding: '20px', 
                    background: isSelected ? '#eff6ff' : '#fff', 
                    borderRadius: '12px', 
                    border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>{o.id.split('-')[0]}</span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{new Date(o.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: statusInfo.color, fontWeight: 700, marginBottom: '12px' }}>
                    <statusInfo.icon size={16} /> {statusInfo.label}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>{o.lines.length} artículos</span>
                    <span style={{ fontWeight: 900, color: '#0f172a' }}>{fmtCurrency(o.grandTotal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content: Order Detail */}
      <div style={{ flex: 1, background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '32px', minHeight: '500px' }}>
        
        {!selectedId ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <Package size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <p>Seleccioná un pedido para ver los detalles.</p>
          </div>
        ) : (
          <OrderDetailView orderId={selectedId} fmtCurrency={fmtCurrency} getStatusDisplay={getStatusDisplay} />
        )}

      </div>

    </div>
  );
}

function OrderDetailView({ orderId, fmtCurrency, getStatusDisplay }: any) {
  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.storefront.order(orderId),
    queryFn: () => storefrontOrdersApi.getMyOrder(orderId),
  });

  if (isLoading || !order) return <div>Cargando detalle...</div>;

  const statusInfo = getStatusDisplay(order.status);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 900 }}>Pedido <span style={{ fontFamily: 'monospace' }}>{order.id.split('-')[0]}</span></h2>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Realizado el {new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <div style={{ padding: '8px 16px', background: '#f8fafc', border: `1px solid ${statusInfo.color}`, borderRadius: '999px', color: statusInfo.color, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <statusInfo.icon size={18} /> {statusInfo.label}
        </div>
      </div>

      {/* Timeline Graphic */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '48px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '16px', left: '0', right: '0', height: '4px', background: '#e2e8f0', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: '16px', left: '0', width: (order.status as string) === 'DELIVERED' ? '100%' : ((order.status as string) === 'SHIPPED' ? '66%' : '33%'), height: '4px', background: '#3b82f6', zIndex: 0, transition: 'all 0.5s' }} />
        
        {[
          { label: 'Pago Aprobado', active: true },
          { label: 'Preparación', active: ['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status as string) },
          { label: 'En Camino', active: ['SHIPPED', 'DELIVERED'].includes(order.status as string) },
          { label: 'Entregado', active: (order.status as string) === 'DELIVERED' },
        ].map((step, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '80px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: step.active ? '#3b82f6' : '#f1f5f9', border: step.active ? 'none' : '4px solid #fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {step.active && <CheckCircle size={18} />}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: step.active ? '#0f172a' : '#94a3b8', marginTop: '8px', textAlign: 'center' }}>{step.label}</span>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800 }}>Artículos</h3>
      <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '32px' }}>
        {order.lines.map((l: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < order.lines.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#e2e8f0', borderRadius: '8px' }} />
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{l.productName || l.variantId}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Cant: {l.quantity}</p>
              </div>
            </div>
            <span style={{ fontWeight: 800 }}>{fmtCurrency(l.finalPrice)}</span>
          </div>
        ))}
        <div style={{ borderTop: '2px solid #e2e8f0', marginTop: '16px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '16px', fontWeight: 800 }}>Total Pagado</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{fmtCurrency(order.grandTotal)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 1, padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Información de Envío</h4>
          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{order.customerName}</p>
          <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Av. Corrientes 1234, CABA<br/>CP: 1043</p>
        </div>
        <div style={{ flex: 1, padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#64748b', textTransform: 'uppercase' }}>Método de Pago</h4>
          <p style={{ margin: '0 0 4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} color="#10b981" /> {order.paymentMethod || 'Tarjeta / MercadoPago'}
          </p>
          <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Transacción aprobada.</p>
        </div>
      </div>

    </div>
  );
}
