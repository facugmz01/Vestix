import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, CheckCircle, AlertTriangle, PackageCheck } from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, 
  SearchInput, FiltersBar, Pagination, EmptyState, 
  ApiErrorDisplay, TableSkeleton, StatusChip
} from '@/components/ui';

import { receiptsApi } from '@/api/receipts.api';
import { queryKeys } from '@/api/queryKeys';
import type { GoodsReceipt } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { GoodsReceiptFormDrawer } from '@/features/purchasing/receipts/components/GoodsReceiptFormDrawer';
import { GoodsReceiptDetailDrawer } from '@/features/purchasing/receipts/components/GoodsReceiptDetailDrawer';

export default function GoodsReceiptsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.receipts.all({ page, pageSize, search, status: statusFilter }),
    queryFn: () => receiptsApi.getReceipts({ page, pageSize, search, status: statusFilter }),
  });

  const handleCreate = () => setFormOpen(true);
  const handleView = (id: string) => { setSelectedId(id); setDetailOpen(true); };

  const receipts = data?.data ?? [];
  const total = data?.total ?? 0;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'gray';
      case 'DISPUTED': return 'orange';
      case 'VALIDATED': return 'green';
      default: return 'gray';
    }
  };

  return (
    <PageContainer 
      title="Recepciones (Remitos de Proveedor)" 
      subtitle="Conteo físico e ingreso al inventario de la mercadería despachada por proveedores."
      action={
        <ActionGuard action="manage" subject="Purchasing">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nuevo Remito
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} remitos</Badge>}>
        <SearchInput placeholder="Buscar por ID..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Estados</option>
          <option value="DRAFT">Conteo Inicial (DRAFT)</option>
          <option value="DISPUTED">Con Diferencias (DISPUTED)</option>
          <option value="VALIDATED">Validados (VALIDATED)</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : receipts.length === 0 ? (
          <EmptyState 
            icon={<PackageCheck size={40} />}
            title="Sin Remitos" 
            message="No hay registros de recepción de mercadería." 
          />
        ) : (
          <Table
            keyField="id"
            data={receipts}
            columns={[
              { 
                key: 'id', 
                header: 'Remito ID',
                render: (r) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{r.id.split('-')[0]}</span>
              },
              { 
                key: 'oc', 
                header: 'Orden Compra',
                render: (r) => <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{r.purchaseOrderId.split('-')[0]}</span>
              },
              { 
                key: 'date', 
                header: 'Fecha Conteo',
                render: (r) => <span style={{ fontSize: '13px' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
              },
              { 
                key: 'lines', 
                header: 'Líneas',
                render: (r) => <Badge color="gray">{r.lines.length} refs</Badge>
              },
              { 
                key: 'status', 
                header: 'Estado Auditoría',
                render: (r) => (
                  <StatusChip 
                    label={r.status === 'DISPUTED' ? 'Diferencias' : r.status === 'VALIDATED' ? 'Validado' : 'Pendiente'} 
                    color={getStatusColor(r.status) as any} 
                    icon={r.status === 'DISPUTED' ? <AlertTriangle size={12} /> : r.status === 'VALIDATED' ? <CheckCircle size={12} /> : undefined}
                  />
                )
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(r.id)} aria-label="Gestionar">
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

      <GoodsReceiptFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
      />
      
      <GoodsReceiptDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        receiptId={selectedId} 
      />

    </PageContainer>
  );
}
