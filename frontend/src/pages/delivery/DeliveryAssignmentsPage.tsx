import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, ChevronRight } from 'lucide-react';
import { deliveryPortalApi } from '@/api/deliveryPortal.api';
import { EmptyState, ApiErrorDisplay } from '@/components/ui';

const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Asignado',
  IN_TRANSIT: 'En camino',
  ARRIVED: 'En destino',
  DELIVERED: 'Entregado',
};

export default function DeliveryAssignmentsPage() {
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['delivery-portal', 'assignments'],
    queryFn: () => deliveryPortalApi.listAssignments({ pageSize: 50 }),
  });

  const assignments = data?.data ?? [];

  if (isLoading) {
    return <div style={{ padding: '24px 0' }}>Cargando envíos...</div>;
  }

  if (error) {
    return <ApiErrorDisplay error={error} onRetry={refetch} />;
  }

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={<Package size={40} />}
        title="Sin envíos asignados"
        message="Cuando te asignen un pedido al despacharlo, aparecerá acá. Pedile al encargado que use tu nombre de usuario al confirmar el despacho."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900 }}>Mis envíos</h1>
      <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px' }}>
        {assignments.length} entrega(s) activa(s)
      </p>

      {assignments.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => navigate(`/delivery/run/${item.id}`)}
          style={{
            width: '100%',
            textAlign: 'left',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            background: '#fff',
            padding: '16px',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', marginBottom: '4px' }}>
                Pedido #{item.orderRef}
              </div>
              <div style={{ fontSize: '14px', color: '#334155', marginBottom: '6px' }}>
                {item.customerName}
              </div>
              {item.shippingAddress && (
                <div style={{ display: 'flex', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                  <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{item.shippingAddress.city}, {item.shippingAddress.state}</span>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: '999px',
                background: '#f5f3ff',
                color: '#7c3aed',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '8px',
              }}>
                {STATUS_LABELS[item.status] || item.status}
              </span>
              <ChevronRight size={18} color="#94a3b8" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
