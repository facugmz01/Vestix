import { FINANCE_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Eye, CreditCard } from 'lucide-react';
import { useState } from 'react';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, Tabs
} from '@/components/ui';

import { paymentsApi } from '@/api/payments.api';
import { queryKeys } from '@/api/queryKeys';
import { PaymentStatusBadge } from '@/features/finance/payments/components/PaymentStatusBadge';
import { PaymentDetailDrawer } from '@/features/finance/payments/components/PaymentDetailDrawer';
import { useListPage } from '@/hooks/useListPage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatPaymentReferenceId, formatShortId } from '@/utils/formatId';
import adminStyles from '@/styles/AdminListShared.module.css';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  DEBIT: 'Débito',
  CREDIT: 'Crédito',
  TRANSFER: 'Transferencia',
  QR: 'QR',
  CHECK: 'Cheque',
  ACCOUNT: 'Cuenta Corriente',
};

export default function PaymentsPage() {
  const { page, pageSize, search, filters, setPage, setSearch, setFilter } = useListPage({ status: '' });

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const statusFilter = filters.status;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.payments.all({ page, pageSize, search, status: statusFilter }),
    queryFn: () => paymentsApi.getPayments({ page, pageSize, search, status: statusFilter }),
  });

  const handleView = (id: string) => { setSelectedId(id); setDetailOpen(true); };

  const payments = data?.data ?? [];
  const total = data?.total ?? 0;



  return (
    <PageContainer
      tabs={<Tabs items={FINANCE_TABS} />}
      
      title="Pagos y Cobranzas" 
      subtitle="Historial de transacciones, cobros en POS, transferencias y pagos en línea."
    >
      <FiltersBar actions={<Badge color="gray">{total} transacciones</Badge>}>
        <SearchInput placeholder="Buscar Ref / Cliente..." onSearch={setSearch} />
        
        <select value={statusFilter} onChange={e => { setFilter('status', e.target.value); }} className={adminStyles.filterSelect}>
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
                render: (p) => <span className={adminStyles.cellMonoBold}>{formatShortId(p.id)}</span>
              },
              { 
                key: 'ref', 
                header: 'Ticket Ref',
                render: (p) => <span className={adminStyles.cellMonoSecondary}>{formatPaymentReferenceId(p.referenceId)}</span>
              },
              { 
                key: 'date', 
                header: 'Fecha',
                render: (p) => <span className={adminStyles.cellDate}>{new Date(p.createdAt).toLocaleString()}</span>
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
                  <div className={adminStyles.cellRowXs}>
                    {p.lines.map((l, i) => (
                      <Badge key={i} color="gray">{PAYMENT_METHOD_LABELS[l.method] || l.method}</Badge>
                    ))}
                  </div>
                )
              },
              { 
                key: 'amount', 
                header: 'Total Cobrado',
                render: (p) => <span className={adminStyles.textBold900}>{formatCurrency(p.amount)}</span>
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
                  <div className={adminStyles.rowActions}>
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
