import { useState } from 'react';
import { INVENTORY_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, History, Settings2, ClipboardCheck } from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, Tabs
} from '@/components/ui';

import { inventoryApi, type EnrichedStockLevel } from '@/api/inventory.api';
import { branchesApi } from '@/api/branches.api';
import { warehousesApi } from '@/api/warehouses.api';
import { queryKeys } from '@/api/queryKeys';
import { ActionGuard } from '@/rbac/ActionGuard';

import { StockAdjustmentModal } from '@/features/inventory/components/StockAdjustmentModal';
import { StockMovementsDrawer } from '@/features/inventory/components/StockMovementsDrawer';
import { StockAuditModal } from '@/features/inventory/components/StockAuditModal';
import { ReplenishmentModal } from '@/features/inventory/components/ReplenishmentModal';

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [kardexOpen, setKardexOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [replOpen, setReplOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<EnrichedStockLevel | null>(null);

  // Lookups for filters
  const { data: branchesData } = useQuery({ queryKey: queryKeys.branches.all(), queryFn: () => branchesApi.getBranches() });
  const { data: warehousesData } = useQuery({ 
    queryKey: queryKeys.warehouses.all({ branchId }), 
    queryFn: () => warehousesApi.getWarehouses({ branchId }),
    enabled: !!branchId
  });

  // Main Stock Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inventory', 'stock', { page, pageSize, search, branchId, warehouseId }],
    queryFn: () => inventoryApi.getStockLevels({ page, pageSize, search, branchId, warehouseId }),
  });

  const handleAdjust = (node: EnrichedStockLevel) => {
    setSelectedNode(node);
    setAdjustOpen(true);
  };

  const handleKardex = (node: EnrichedStockLevel) => {
    setSelectedNode(node);
    setKardexOpen(true);
  };

  const stockList = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer
      tabs={<Tabs items={INVENTORY_TABS} />}
      
      title="Estado de Inventario" 
      subtitle="Visualización consolidada de existencias, disponibilidades y reservas por depósito."
      action={
        <ActionGuard action="manage" subject="Inventory">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="primary" icon={<ClipboardCheck size={16} />} onClick={() => setAuditOpen(true)}>
              Auditoría de Stock (Masivo)
            </Button>
            <Button variant="secondary" icon={<Settings2 size={16} />} onClick={() => setReplOpen(true)}>
              Reglas de Reposición
            </Button>
          </div>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} nodos de stock</Badge>}>
        <SearchInput placeholder="Buscar por SKU o Producto..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        
        <select value={branchId} onChange={e => { setBranchId(e.target.value); setWarehouseId(''); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todas las Sucursales</option>
          {branchesData?.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>

        <select value={warehouseId} onChange={e => { setWarehouseId(e.target.value); setPage(1); }} disabled={!branchId} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Depósitos</option>
          {warehousesData?.data.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : stockList.length === 0 ? (
          <EmptyState 
            title="Sin resultados de stock" 
            message="No se encontraron niveles de inventario para los filtros aplicados. Intentá realizar una Recepción de Mercadería." 
          />
        ) : (
          <Table
            keyField="id"
            data={stockList}
            columns={[
              { 
                key: 'product', 
                header: 'SKU / Producto',
                render: (s) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{s.variantSku}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.productName}</span>
                  </div>
                )
              },
              { 
                key: 'location', 
                header: 'Ubicación (Rama)',
                render: (s) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>{s.warehouseName}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.branchName}</span>
                  </div>
                )
              },
              { 
                key: 'physical', 
                header: 'Stock Físico',
                render: (s) => (
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {s.physicalQuantity ?? (s.availableQuantity + s.reservedQuantity)}
                  </span>
                )
              },
              { 
                key: 'reserved', 
                header: 'Reservado',
                render: (s) => (
                  <span style={{ fontSize: '13px', fontWeight: 600, color: s.reservedQuantity > 0 ? 'var(--orange)' : 'var(--text-muted)' }}>
                    {s.reservedQuantity > 0 ? s.reservedQuantity : '0'}
                  </span>
                )
              },
              { 
                key: 'available', 
                header: 'Disponible',
                render: (s) => (
                  <span style={{ fontSize: '15px', fontWeight: 800, color: s.availableQuantity <= 0 ? 'var(--red)' : 'var(--green)' }}>
                    {s.availableQuantity}
                  </span>
                )
              },
              {
                key: 'actions',
                header: '',
                render: (s) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleKardex(s)} aria-label="Ver Kardex" title="Historial de movimientos">
                      <History size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Inventory">
                      <Button variant="ghost" size="sm" onClick={() => handleAdjust(s)} aria-label="Ajuste Manual" title="Ajuste manual de stock">
                        <SlidersHorizontal size={16} color="var(--accent)" />
                      </Button>
                    </ActionGuard>
                  </div>
                )
              }
            ]}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <StockAdjustmentModal 
        open={adjustOpen} 
        onClose={() => setAdjustOpen(false)} 
        stockNode={selectedNode} 
      />
      
      <StockMovementsDrawer 
        open={kardexOpen} 
        onClose={() => setKardexOpen(false)} 
        stockNode={selectedNode} 
      />

      <StockAuditModal open={auditOpen} onClose={() => setAuditOpen(false)} onSuccess={() => { setAuditOpen(false); refetch(); }} />
      <ReplenishmentModal open={replOpen} onClose={() => setReplOpen(false)} onSuccess={() => { setReplOpen(false); refetch(); }} />
    </PageContainer>
  );
}
