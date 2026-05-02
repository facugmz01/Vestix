import { Drawer, StatusChip, Badge, Button, Table } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { customersApi } from '@/api/customers.api';
import type { Customer } from '@/types';
import { ShoppingCart, Star, CreditCard, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters'; // Assuming it exists, otherwise inline it

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function CustomerDetailDrawer({ open, onClose, customer }: Props) {
  if (!customer) return null;

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  // Fetch mock history or real history
  const { data: history, isLoading } = useQuery({
    queryKey: queryKeys.customers.history(customer.id),
    queryFn: () => customersApi.getHistory(customer.id),
    enabled: open,
  });

  return (
    <Drawer open={open} onClose={onClose} title="Ficha del Cliente" width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Profile */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
            {customer.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {customer.fullName}
              </h3>
              <Badge color={customer.type === 'BUSINESS' ? 'blue' : 'gray'}>
                {customer.type === 'BUSINESS' ? 'B2B (Empresa)' : 'B2C (Final)'}
              </Badge>
              {customer.credit.onHold && <StatusChip label="Crédito Retenido" color="red" size="sm" />}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              {customer.email} • {customer.phone} • {customer.taxId ? `DNI/CUIT: ${customer.taxId}` : ''}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          {/* Credit View */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', background: 'var(--bg-base)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <CreditCard size={18} color="var(--accent)" />
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Cuenta Corriente</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Límite Total:</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{fmtCurrency(customer.credit.limit)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Utilizado:</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: customer.credit.used > 0 ? 'var(--red)' : 'var(--text-primary)' }}>{fmtCurrency(customer.credit.used)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>Disponible:</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)' }}>{fmtCurrency(customer.credit.available)}</span>
              </div>
            </div>
          </div>

          {/* Loyalty Summary */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px', background: 'var(--bg-base)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Star size={18} color="var(--yellow)" fill="var(--yellow)" />
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Fidelización</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nivel:</span>
                <Badge color="purple">Mayorista VIP</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Lista de Precios:</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>LP_MAYORISTA (-15%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Puntos Acumulados:</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>4,250 pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase History */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShoppingCart size={18} color="var(--text-secondary)" />
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Historial de Compras</h4>
          </div>
          
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando historial...</div>
            ) : (!history || history.length === 0) ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>El cliente aún no tiene compras registradas.</div>
            ) : (
              <Table
                keyField="id"
                data={history}
                columns={[
                  { key: 'date', header: 'Fecha', render: (h) => new Date(h.createdAt).toLocaleDateString() },
                  { key: 'id', header: 'Ticket / Factura', render: (h) => <span style={{ fontFamily: 'monospace' }}>#{h.id.slice(-6)}</span> },
                  { key: 'total', header: 'Total', render: (h) => <strong>{fmtCurrency(h.grandTotal)}</strong> },
                  { key: 'method', header: 'Método', render: (h) => <Badge color="gray">{h.paymentMethod}</Badge> },
                  { key: 'action', header: '', render: () => <Button variant="ghost" size="sm"><ExternalLink size={14} /></Button> }
                ]}
              />
            )}
          </div>
        </div>

      </div>
    </Drawer>
  );
}
