import { useState } from 'react';
import { PURCHASING_TABS } from '@/navigation/moduleTabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Truck, Package, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, StatusChip, Tabs
} from '@/components/ui';

import { purchasesApi } from '@/api/purchases.api';
import { suppliersApi } from '@/api/suppliers.api';
import { queryKeys } from '@/api/queryKeys';
import type { PurchaseOrder } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { PurchaseFormDrawer } from '@/features/purchasing/components/PurchaseFormDrawer';
import { PurchaseDetailDrawer } from '@/features/purchasing/components/PurchaseDetailDrawer';
import { ImportPurchasesModal } from '@/features/purchasing/components/ImportPurchasesModal';
import { FileSpreadsheet } from 'lucide-react';

export default function PurchasingPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  const { data: suppliersData } = useQuery({ queryKey: queryKeys.suppliers.all(), queryFn: () => suppliersApi.getSuppliers({}) });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.purchases.all({ page, pageSize, search, status: statusFilter, supplierId: supplierFilter }),
    queryFn: () => purchasesApi.getOrders({ page, pageSize, search, status: statusFilter, supplierId: supplierFilter }),
  });

  const handleCreate = () => {
    setSelectedOrder(null);
    setFormOpen(true);
  };

  const handleEdit = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setFormOpen(true);
  };

  const handleView = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: string) => purchasesApi.removeOrder(id),
    onSuccess: () => {
      toast.success('Borrador eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al eliminar'),
  });

  const handleDelete = (order: PurchaseOrder) => {
    if (window.confirm('¿Estás seguro de eliminar este borrador de orden de compra?')) {
      deleteMutation.mutate(order.id);
    }
  };

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'gray';
      case 'ISSUED': return 'blue';
      case 'PARTIALLY_RECEIVED': return 'orange';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'Borrador';
      case 'ISSUED': return 'Emitida al Prov.';
      case 'PARTIALLY_RECEIVED': return 'Recepción Parcial';
      case 'COMPLETED': return 'Cumplida';
      case 'CANCELLED': return 'Cancelada';
      default: return s;
    }
  };

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <PageContainer
      tabs={<Tabs items={PURCHASING_TABS} />}
      
      title="Compras y Abastecimiento (PO)" 
      subtitle="Gestioná las órdenes de compra (PO), su estado de recepción y facturación."
      action={
        <ActionGuard action="manage" subject="Purchasing">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="secondary" 
              icon={<FileSpreadsheet size={16} />} 
              onClick={() => setImportOpen(true)}
            >
              Importar Compras Históricas
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
              Nueva Orden (PO)
            </Button>
            <Button variant="secondary" icon={<Truck size={16} />} onClick={() => navigate('/admin/purchasing/new')}>
              Ingreso Directo (Stock)
            </Button>
          </div>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} órdenes</Badge>}>
        <SearchInput placeholder="Buscar por OC ID..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Estados</option>
          <option value="DRAFT">Borradores (DRAFT)</option>
          <option value="ISSUED">Emitidas (ISSUED)</option>
          <option value="PARTIALLY_RECEIVED">Recepción Parcial</option>
          <option value="COMPLETED">Cumplidas (COMPLETED)</option>
        </select>

        <select value={supplierFilter} onChange={e => { setSupplierFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Proveedores</option>
          {suppliersData?.data.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : orders.length === 0 ? (
          <EmptyState 
            icon={<Package size={40} />}
            title="Sin Órdenes de Compra" 
            message="No hay registros de compras. Creá tu primer pedido a un proveedor." 
          />
        ) : (
          <Table
            keyField="id"
            data={orders}
            columns={[
              { 
                key: 'id', 
                header: 'OC ID',
                render: (o) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{o.id.split('-')[0]}</span>
              },
              { 
                key: 'supplier', 
                header: 'Proveedor',
                render: (o: any) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.supplier?.companyName || o.supplier?.name || 'Desconocido'}</span>
              },
              { 
                key: 'date', 
                header: 'Fecha Emisión',
                render: (o) => <span style={{ fontSize: '13px' }}>{new Date(o.createdAt).toLocaleDateString()}</span>
              },
              { 
                key: 'amount', 
                header: 'Monto Total',
                render: (o) => <span style={{ fontWeight: 800 }}>{fmtCurrency(o.totalAmount)}</span>
              },
              { 
                key: 'status', 
                header: 'Estado',
                render: (o) => <StatusChip label={getStatusLabel(o.status)} color={getStatusColor(o.status) as any} />
              },
              {
                key: 'actions',
                header: '',
                render: (o) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(o)} aria-label="Gestionar" title="Ver detalle o Gestionar recepción">
                      {o.status === 'ISSUED' || o.status === 'PARTIALLY_RECEIVED' ? <Truck size={16} color="var(--blue)" /> : <Eye size={16} />}
                    </Button>
                    {o.status === 'DRAFT' && (
                      <ActionGuard action="manage" subject="Purchasing">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(o)} aria-label="Editar" title="Editar borrador">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(o)} aria-label="Eliminar" title="Eliminar borrador">
                          <Trash2 size={16} color="var(--red)" />
                        </Button>
                      </ActionGuard>
                    )}
                  </div>
                )
              }
            ]}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <PurchaseFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)}
        orderToEdit={selectedOrder?.status === 'DRAFT' ? selectedOrder : null}
      />
      
      {selectedOrder && (
        <PurchaseDetailDrawer 
          open={detailOpen} 
          onClose={() => setDetailOpen(false)} 
          orderId={selectedOrder.id} 
        />
      )}

      <ImportPurchasesModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          refetch();
          toast.success('Compras importadas. Revisá los resultados.');
        }}
      />
    </PageContainer>
  );
}
