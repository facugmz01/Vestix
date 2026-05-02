import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownRight, History, Download, Eye } from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, 
  SearchInput, FiltersBar, Pagination, EmptyState, 
  ApiErrorDisplay, TableSkeleton 
} from '@/components/ui';

import { inventoryApi } from '@/api/inventory.api';
import { branchesApi } from '@/api/branches.api';
import { warehousesApi } from '@/api/warehouses.api';
import { queryKeys } from '@/api/queryKeys';

import { MovementDetailDrawer } from '@/features/inventory/components/MovementDetailDrawer';

export default function StockMovementsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Lookups for filters
  const { data: branchesData } = useQuery({ queryKey: queryKeys.branches.all(), queryFn: () => branchesApi.getBranches() });
  const { data: warehousesData } = useQuery({ 
    queryKey: queryKeys.warehouses.all({ branchId }), 
    queryFn: () => warehousesApi.getWarehouses({ branchId }),
    enabled: !!branchId
  });

  // Main Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.stock.movements({ page, pageSize, search, branchId, warehouseId, type, startDate, endDate }),
    queryFn: () => inventoryApi.getAllMovements({ page, pageSize, search, branchId, warehouseId, type, startDate, endDate }),
  });

  const handleView = (id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const movements = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer 
      title="Libro Mayor de Movimientos (Kardex Global)" 
      subtitle="Trazabilidad y auditoría completa de entradas, salidas y ajustes de mercadería."
      action={
        <Button variant="outline" icon={<Download size={16} />}>
          Exportar Excel
        </Button>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} transacciones</Badge>}>
        <SearchInput placeholder="Buscar por Producto o Doc. Ref..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        
        <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todas las Operaciones</option>
          <option value="ADD">Entradas (+)</option>
          <option value="SUBTRACT">Salidas (-)</option>
          <option value="SET">Ajustes Físicos (=)</option>
        </select>

        <select value={branchId} onChange={e => { setBranchId(e.target.value); setWarehouseId(''); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todas las Sucursales</option>
          {branchesData?.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <select value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setPage(1); }} disabled={!branchId} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Depósitos</option>
          {warehousesData?.data.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>

        <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }} title="Fecha desde" />
        <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }} title="Fecha hasta" />
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : movements.length === 0 ? (
          <EmptyState 
            title="Sin Movimientos" 
            message="No se registraron transacciones que coincidan con los filtros seleccionados." 
          />
        ) : (
          <Table
            keyField="id"
            data={movements}
            columns={[
              { 
                key: 'date', 
                header: 'Fecha',
                render: (m) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 500 }}>{new Date(m.createdAt).toLocaleDateString()}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleTimeString()}</span>
                  </div>
                )
              },
              { 
                key: 'type', 
                header: 'Operación',
                render: (m) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {m.type === 'ADD' ? <ArrowUpRight size={16} color="var(--green)" /> : m.type === 'SUBTRACT' ? <ArrowDownRight size={16} color="var(--red)" /> : <History size={16} color="var(--blue)" />}
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{m.type === 'ADD' ? 'ENTRADA' : m.type === 'SUBTRACT' ? 'SALIDA' : 'AJUSTE'}</span>
                  </div>
                )
              },
              { 
                key: 'product', 
                header: 'SKU / Producto',
                render: (m) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{m.variantSku}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.productName}</span>
                  </div>
                )
              },
              { 
                key: 'location', 
                header: 'Depósito',
                render: (m) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{m.warehouseName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.branchName}</span>
                  </div>
                )
              },
              { 
                key: 'qty', 
                header: 'Cant.',
                render: (m) => (
                  <span style={{ fontSize: '15px', fontWeight: 800, color: m.type === 'ADD' ? 'var(--green)' : m.type === 'SUBTRACT' ? 'var(--red)' : 'var(--text-primary)' }}>
                    {m.type === 'ADD' ? '+' : m.type === 'SUBTRACT' ? '-' : ''}{m.quantity}
                  </span>
                )
              },
              { 
                key: 'ref', 
                header: 'Doc. Referencia',
                render: (m) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>{m.referenceId}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.referenceType || 'Ajuste'}</span>
                  </div>
                )
              },
              {
                key: 'actions',
                header: '',
                render: (m) => (
                  <Button variant="ghost" size="sm" onClick={() => handleView(m.id)} aria-label="Ver Detalles" title="Ver trazabilidad">
                    <Eye size={16} />
                  </Button>
                )
              }
            ]}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <MovementDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        movementId={selectedId} 
      />

    </PageContainer>
  );
}
