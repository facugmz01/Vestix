import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, CreditCard } from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, 
  SearchInput, FiltersBar, Pagination, EmptyState, 
  ApiErrorDisplay, TableSkeleton 
} from '@/components/ui';

import { paymentsApi } from '@/api/payments.api';
import { queryKeys } from '@/api/queryKeys';
import { PaymentStatusBadge } from '@/features/finance/payments/components/PaymentStatusBadge';
import { PaymentDetailDrawer } from '@/features/finance/payments/components/PaymentDetailDrawer';

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.payments.all({ page, pageSize, search, status: statusFilter }),
    queryFn: () => paymentsApi.getPayments({ page, pageSize, search, status: statusFilter }),
  });

  const handleView = (id: string) => { setSelectedId(id); setDetailOpen(true); };

  const payments = data?.data ?? [];
  const total = data?.total ?? 0;

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <PageContainer 
      title="Pagos y Cobranzas" 
      subtitle="Historial de transacciones, cobros en POS, transferencias y pagos en línea."
    >
      <FiltersBar actions={<Badge color="gray">{total} transacciones</Badge>}>
        <SearchInput placeholder="Buscar Ref / Cliente..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Estados</option>
          <option value="PENDING">Pendientes</option>
          <option value="COMPLETED">Completados / Acreditados</option>
          <option value="FAILED">Rechazados</option>
          <option value="REFUNDED">Reembolsados</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : payments.length === 0 ? (
          <EmptyState 
            icon={<CreditCard size={40} />}
            title="Sin Transacciones" 
            message="No hay cobros registrados con estos filtros." 
          />
        ) : (
          <Table
            keyField="id"
            data={payments}
            columns={[
              { 
                key: 'id', 
                header: 'Tx ID',
                render: (p) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{p.id.split('-')[0]}</span>
              },
              { 
                key: 'ref', 
                header: 'Ticket Ref',
                render: (p) => <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{p.referenceId}</span>
              },
              { 
                key: 'date', 
                header: 'Fecha',
                render: (p) => <span style={{ fontSize: '13px' }}>{new Date(p.createdAt).toLocaleString()}</span>
              },
              { 
                key: 'customer', 
                header: 'Cliente',
                render: (p) => <span>{p.customerName || 'CF'}</span>
              },
              { 
                key: 'methods', 
                header: 'Medios',
                render: (p) => (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {p.lines.map((l, i) => (
                      <Badge key={i} color="gray">{l.method}</Badge>
                    ))}
                  </div>
                )
              },
              { 
                key: 'amount', 
                header: 'Total Cobrado',
                render: (p) => <span style={{ fontWeight: 900 }}>{fmtCurrency(p.amount)}</span>
              },
              { 
                key: 'status', 
                header: 'Estado',
                render: (p) => <PaymentStatusBadge status={p.status} />
              },
              {
                key: 'actions',
                header: '',
                render: (p) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(p.id)} aria-label="Ver Detalle">
                      <Eye size={16} />
                    </Button>
                  </div>
                )
              }
            ]}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <PaymentDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        paymentId={selectedId} 
      />

    </PageContainer>
  );
}
