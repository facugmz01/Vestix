import { FINANCE_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, FileText, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, Tabs
} from '@/components/ui';

import { invoicesApi } from '@/api/invoices.api';
import { queryKeys } from '@/api/queryKeys';
import { AfipFailedJobs } from '@/features/invoicing/components/AfipFailedJobs';
import { ActionGuard } from '@/rbac/ActionGuard';
import { InvoiceStatusBadge } from '@/features/finance/invoices/components/InvoiceStatusBadge';
import { IssueInvoiceDrawer } from '@/features/finance/invoices/components/IssueInvoiceDrawer';
import { InvoiceDetailDrawer } from '@/features/finance/invoices/components/InvoiceDetailDrawer';
import { useListPage } from '@/hooks/useListPage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId, formatShortId } from '@/utils/formatId';
import adminStyles from '@/styles/AdminListShared.module.css';

const INVOICE_TYPE_LABELS: Record<string, string> = {
  FACTURA_A: 'Factura A', FACTURA_B: 'Factura B', FACTURA_C: 'Factura C',
  NOTA_CREDITO_A: 'N/C A', NOTA_CREDITO_B: 'N/C B',
};

export default function InvoicesPage() {
  const { page, pageSize, search, filters, setPage, setSearch, setFilter } = useListPage({ status: '', type: '' });

  const statusFilter = filters.status;
  const typeFilter = filters.type;

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
        <SearchInput placeholder="Buscar por CAE, Venta, CUIT..." onSearch={setSearch} />

        <select value={statusFilter} onChange={e => { setFilter('status', e.target.value); }} className={adminStyles.filterSelect}>
          <option value="">Todos los Estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="ISSUED">Emitidas (CAE OK)</option>
          <option value="FAILED">Con Error AFIP</option>
          <option value="CANCELLED">Anuladas</option>
        </select>

        <select value={typeFilter} onChange={e => { setFilter('type', e.target.value); }} className={adminStyles.filterSelect}>
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
        <div className={adminStyles.alertBannerRed}>
          <AlertTriangle size={18} color="var(--red)" />
          <span className={adminStyles.alertBody}>
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
              { key: 'id', header: 'ID', render: i => <span className={adminStyles.cellMonoBold}>{formatShortId(i.id)}</span> },
              { key: 'saleOrderId', header: 'Venta Ref.', render: i => <span className={adminStyles.cellMonoSecondary}>{formatSaleId(i.saleOrderId)}</span> },
              { key: 'date', header: 'Fecha', render: i => <span className={adminStyles.cellDate}>{new Date(i.createdAt).toLocaleString()}</span> },
              { key: 'type', header: 'Tipo', render: i => <Badge color="blue">{INVOICE_TYPE_LABELS[i.type]}</Badge> },
              { key: 'receiver', header: 'Receptor', render: i => <span className={adminStyles.cellPrimary}>{i.receiverName}</span> },
              { key: 'cae', header: 'CAE', render: i => i.cae ? <span className={adminStyles.cellMonoCode}>{i.cae}</span> : <span className={adminStyles.textMutedDash}>—</span> },
              { key: 'total', header: 'Total', render: i => <span className={adminStyles.textBold900}>{formatCurrency(i.total)}</span> },
              { key: 'status', header: 'Estado', render: i => <InvoiceStatusBadge status={i.status} /> },
              {
                key: 'actions', header: '',
                render: i => (
                  <div className={adminStyles.rowActions}>
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
