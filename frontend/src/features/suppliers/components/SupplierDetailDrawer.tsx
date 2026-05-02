import { Drawer, Badge, Button, Table } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { suppliersApi } from '@/api/suppliers.api';
import type { Supplier } from '@/types';
import { Briefcase, CreditCard, Receipt, FileText } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

export function SupplierDetailDrawer({ open, onClose, supplier }: Props) {
  if (!supplier) return null;

  const fmtCurrency = (val: number, cur: string) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: cur }).format(val);

  // Fetch Ledger (Account history)
  const { data: ledger, isLoading } = useQuery({
    queryKey: queryKeys.suppliers.ledger(supplier.id),
    queryFn: () => suppliersApi.getLedger(supplier.id),
    enabled: open,
  });

  return (
    <Drawer open={open} onClose={onClose} title="Ficha del Proveedor" width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Profile */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {supplier.companyName}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              CUIT: {supplier.taxId || 'No registrado'} • Contacto: {supplier.contactName || 'No especificado'}
            </p>
            {supplier.email && (
              <p style={{ fontSize: '13px', color: 'var(--accent)', margin: '4px 0 0' }}>
                {supplier.email}
              </p>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', background: supplier.account?.balance > 0 ? 'var(--red-bg)' : 'var(--bg-base)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CreditCard size={18} color={supplier.account?.balance > 0 ? "var(--red)" : "var(--accent)"} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Estado de Cuenta
            </h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: supplier.account?.balance > 0 ? "var(--red)" : "var(--green)", lineHeight: 1 }}>
              {fmtCurrency(supplier.account?.balance || 0, supplier.account?.currency || 'ARS')}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', paddingBottom: '4px' }}>
              {supplier.account?.balance > 0 ? 'Saldo pendiente a pagar' : 'Al día'}
            </span>
          </div>
          {supplier.account?.balance > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Button variant="primary" size="sm" icon={<Receipt size={14} />}>Registrar Pago</Button>
            </div>
          )}
        </div>

        {/* Ledger / History */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FileText size={18} color="var(--text-secondary)" />
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Libro Mayor (Últimos Movimientos)</h4>
          </div>
          
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando movimientos...</div>
            ) : (!ledger || ledger.length === 0) ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Sin movimientos financieros recientes.</div>
            ) : (
              <Table
                keyField="id"
                data={ledger}
                columns={[
                  { key: 'date', header: 'Fecha', render: (l) => new Date(l.date).toLocaleDateString() },
                  { key: 'concept', header: 'Concepto', render: (l) => l.concept },
                  { key: 'debit', header: 'Debe (Pagos)', render: (l) => l.debit > 0 ? <span style={{ color: 'var(--green)' }}>{fmtCurrency(l.debit, supplier.account?.currency)}</span> : '-' },
                  { key: 'credit', header: 'Haber (Facturas)', render: (l) => l.credit > 0 ? <span style={{ color: 'var(--red)' }}>{fmtCurrency(l.credit, supplier.account?.currency)}</span> : '-' },
                  { key: 'balance', header: 'Saldo', render: (l) => <strong>{fmtCurrency(l.balance, supplier.account?.currency)}</strong> }
                ]}
              />
            )}
          </div>
        </div>

      </div>
    </Drawer>
  );
}
