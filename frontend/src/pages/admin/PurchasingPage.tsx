import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Send, Truck, Package } from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, 
  SearchInput, FiltersBar, Pagination, EmptyState, 
  ApiErrorDisplay, TableSkeleton, StatusChip
} from '@/components/ui';

import { purchasesApi } from '@/api/purchases.api';
import { suppliersApi } from '@/api/suppliers.api';
import { queryKeys } from '@/api/queryKeys';
import type { PurchaseOrder } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { PurchaseFormDrawer } from '@/features/purchasing/components/PurchaseFormDrawer';
import { PurchaseDetailDrawer } from '@/features/purchasing/components/PurchaseDetailDrawer';

export default function PurchasingPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
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
      title="Compras y Abastecimiento (PO)" 
      subtitle="Gestioná Órdenes de Compra, recepciones de mercadería y cuentas corrientes con proveedores."
      action={
        <div style={{ display: 'flex', gap: '12px' }}>
          <ActionGuard action="manage" subject="Purchasing">
            <Button variant="secondary" icon={<Plus size={16} />} onClick={handleCreate}>
              Nueva OC (Borrador)
            </Button>
            <Button variant="primary" icon={<Truck size={16} />} onClick={() => navigate('/admin/purchasing/new')}>
              Ingreso Directo (Stock)
            </Button>
          </ActionGuard>
        </div>
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
                render: (o) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.supplierName || 'Desconocido'}</span>
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
                          <Send size={16} />
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
      
      <PurchaseDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        orderId={selectedOrder?.id || null} 
      />

    </PageContainer>
  );
}
