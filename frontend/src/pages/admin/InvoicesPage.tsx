import { useState } from 'react';
import { FINANCE_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, FileText, AlertTriangle } from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, Tabs
} from '@/components/ui';

import { invoicesApi } from '@/api/invoices.api';
import { queryKeys } from '@/api/queryKeys';
import { ActionGuard } from '@/rbac/ActionGuard';
import { InvoiceStatusBadge } from '@/features/finance/invoices/components/InvoiceStatusBadge';
import { IssueInvoiceDrawer } from '@/features/finance/invoices/components/IssueInvoiceDrawer';
import { InvoiceDetailDrawer } from '@/features/finance/invoices/components/InvoiceDetailDrawer';

const INVOICE_TYPE_LABELS: Record<string, string> = {
  FACTURA_A: 'Factura A', FACTURA_B: 'Factura B', FACTURA_C: 'Factura C',
  NOTA_CREDITO_A: 'N/C A', NOTA_CREDITO_B: 'N/C B',
};

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [issueOpen, setIssueOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.invoices.all({ page, pageSize, search, status: statusFilter, type: typeFilter }),
    queryFn: () => invoicesApi.getInvoices({ page, pageSize, search, status: statusFilter, type: typeFilter }),
  });

  const handleView = (id: string) => { setSelectedId(id); setDetailOpen(true); };

  const invoices = data?.data ?? [];
  const total = data?.total ?? 0;
  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <PageContainer
      tabs={<Tabs items={FINANCE_TABS} />}
            title="Facturación Electrónica (AFIP)"
      subtitle="Registro de comprobantes electrónicos: Facturas A/B/C y Notas de Crédito."
      action={
        <ActionGuard action="manage" subject="Finance">
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIssueOpen(true)}>
            Emitir Comprobante
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} comprobantes</Badge>}>
        <SearchInput placeholder="Buscar por CAE, Venta, CUIT..." onSearch={val => { setSearch(val); setPage(1); }} />

        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="ISSUED">Emitidas (CAE OK)</option>
          <option value="FAILED">Con Error AFIP</option>
          <option value="CANCELLED">Anuladas</option>
        </select>

        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Tipos</option>
          <option value="FACTURA_A">Factura A</option>
          <option value="FACTURA_B">Factura B</option>
          <option value="FACTURA_C">Factura C</option>
          <option value="NOTA_CREDITO_A">Nota de Crédito A</option>
          <option value="NOTA_CREDITO_B">Nota de Crédito B</option>
        </select>
      </FiltersBar>

      {/* Summary stats */}
      {!isLoading && invoices.some(i => i.status === 'FAILED') && (
        <div style={{ padding: '12px 16px', background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <AlertTriangle size={18} color="var(--red)" />
          <span style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 600 }}>
            Hay {invoices.filter(i => i.status === 'FAILED').length} comprobante(s) con error de AFIP. Revisá y reintentá la emisión.
          </span>
        </div>
      )}

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} />}
            title="Sin Comprobantes"
            message="No hay comprobantes emitidos con los filtros seleccionados."
          />
        ) : (
          <Table
            keyField="id"
            data={invoices}
            columns={[
              { key: 'id', header: 'ID', render: i => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{i.id.split('-')[0]}</span> },
              { key: 'saleOrderId', header: 'Venta Ref.', render: i => <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{i.saleOrderId.split('-')[0]}</span> },
              { key: 'date', header: 'Fecha', render: i => <span style={{ fontSize: '13px' }}>{new Date(i.createdAt).toLocaleString()}</span> },
              { key: 'type', header: 'Tipo', render: i => <Badge color="blue">{INVOICE_TYPE_LABELS[i.type]}</Badge> },
              { key: 'receiver', header: 'Receptor', render: i => <span style={{ fontWeight: 600 }}>{i.receiverName}</span> },
              { key: 'cae', header: 'CAE', render: i => i.cae ? <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{i.cae}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
              { key: 'total', header: 'Total', render: i => <span style={{ fontWeight: 900 }}>{fmtCurrency(i.total)}</span> },
              { key: 'status', header: 'Estado', render: i => <InvoiceStatusBadge status={i.status} /> },
              {
                key: 'actions', header: '',
                render: i => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(i.id)} aria-label="Ver Detalle"><Eye size={16} /></Button>
                  </div>
                )
              },
            ]}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <IssueInvoiceDrawer open={issueOpen} onClose={() => setIssueOpen(false)} />
      <InvoiceDetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} invoiceId={selectedId} />

    </PageContainer>
  );
}
