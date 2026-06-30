import { SALES_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, ShoppingCart, PackageCheck, CheckCircle } from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, StatusChip, Tabs
} from '@/components/ui';

import { salesApi } from '@/api/sales.api';
import { queryKeys } from '@/api/queryKeys';

import { ActionGuard } from '@/rbac/ActionGuard';

import { SaleFormDrawer } from '@/features/sales/components/SaleFormDrawer';
import { SaleDetailDrawer } from '@/features/sales/components/SaleDetailDrawer';
import { ImportSalesModal } from '@/features/sales/components/ImportSalesModal';
import { FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useListPage } from '@/hooks/useListPage';
import { formatCurrency } from '@/utils/formatCurrency';
import { useState } from 'react';

export default function SalesPage() {
  const { page, pageSize, search, filters, setPage, setSearch, setFilter } = useListPage({ status: '' });

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const statusFilter = filters.status;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.sales.all({ page, pageSize, search, status: statusFilter }),
    queryFn: () => salesApi.getSales({ page, pageSize, search, status: statusFilter }),
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await salesApi.updateStatus(id, status);
      toast.success('Estado actualizado exitosamente');
      refetch();
    } catch (err: any) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleCreate = () => setFormOpen(true);
  const handleView = (id: string) => { setSelectedSaleId(id); setDetailOpen(true); };

  const sales = data?.data ?? [];
  const total = data?.total ?? 0;

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'QUOTATION': return 'orange';
      case 'PENDING_PAYMENT': return 'yellow';
      case 'CONFIRMED': return 'blue';
      case 'READY_FOR_PICKUP': return 'purple';
      case 'DELIVERED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <PageContainer
      tabs={<Tabs items={SALES_TABS} />}
      
      title="Operaciones de Venta (Backoffice)" 
      subtitle="Monitor general de ventas confirmadas y presupuestos (Quotations) generados en todas las sucursales."
      action={
        <ActionGuard action="manage" subject="Sales">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="secondary" 
              icon={<FileSpreadsheet size={16} />} 
              onClick={() => setImportOpen(true)}
            >
              Importar Ventas Históricas
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
              Crear Presupuesto / Venta
            </Button>
          </div>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} documentos</Badge>}>
        <SearchInput placeholder="Buscar por ID de Venta..." onSearch={setSearch} />
        
        <select value={statusFilter} onChange={e => { setFilter('status', e.target.value); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Estados</option>
          <option value="QUOTATION">Solo Presupuestos</option>
          <option value="PENDING_PAYMENT">Pago Pendiente</option>
          <option value="CONFIRMED">Ventas Confirmadas</option>
          <option value="READY_FOR_PICKUP">Listos para Retiro</option>
          <option value="DELIVERED">Entregados</option>
          <option value="CANCELLED">Canceladas / Rechazadas</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : sales.length === 0 ? (
          <EmptyState 
            icon={<ShoppingCart size={40} />}
            title="Sin Ventas" 
            message="No hay registros comerciales con los filtros indicados." 
          />
        ) : (
          <Table
            keyField="id"
            data={sales}
            columns={[
              { 
                key: 'id', 
                header: 'Doc ID',
                render: (s) => (
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                    {s.status === 'QUOTATION' ? 'P-' : 'V-'}{s.id.split('-')[0].toUpperCase()}
                  </span>
                )
              },
              { 
                key: 'date', 
                header: 'Fecha',
                render: (s) => <span style={{ fontSize: '13px' }}>{new Date(s.createdAt).toLocaleDateString()}</span>
              },
              { 
                key: 'source', 
                header: 'Canal',
                render: (s) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Badge color="gray">
                      {s.source}
                    </Badge>
                  </div>
                )
              },
              { 
                key: 'customer', 
                header: 'Cliente',
                render: (s) => <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{s.customerName || 'Consumidor Final'}</span>
              },
              { 
                key: 'payment', 
                header: 'Condición',
                render: (s) => {
                  const names: any = { CASH: 'Efectivo', CREDIT_CARD: 'Tarjeta', BANK_TRANSFER: 'Transferencia', CUSTOMER_CREDIT: 'Cta. Corriente' };
                  return <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{names[s.paymentMethod] || s.paymentMethod}</span>
                }
              },
              { 
                key: 'total', 
                header: 'Monto Final',
                render: (s) => <span style={{ fontWeight: 900, fontSize: '15px' }}>{formatCurrency(s.grandTotal)}</span>
              },
              { 
                key: 'status', 
                header: 'Estado Comercial',
                render: (s) => {
                  const labels: any = {
                    QUOTATION: 'Presupuesto',
                    PENDING_PAYMENT: 'Pago Pendiente',
                    CONFIRMED: 'Confirmado',
                    READY_FOR_PICKUP: 'Listo P/Retiro',
                    DELIVERED: 'Entregado',
                    CANCELLED: 'Cancelado'
                  };
                  return <StatusChip label={labels[s.status] || s.status} color={getStatusColor(s.status) as any} />;
                }
              },
              {
                key: 'actions',
                header: '',
                render: (s) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {s.status === 'CONFIRMED' && (
                      <Button variant="secondary" size="sm" onClick={() => updateStatus(s.id, 'READY_FOR_PICKUP')} aria-label="Listo para Retiro" title="Marcar Listo para Retiro">
                        <PackageCheck size={16} />
                      </Button>
                    )}
                    {s.status === 'READY_FOR_PICKUP' && (
                      <Button variant="primary" size="sm" onClick={() => updateStatus(s.id, 'DELIVERED')} aria-label="Entregado" title="Marcar Entregado">
                        <CheckCircle size={16} />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleView(s.id)} aria-label="Ver Detalles" title="Abrir Visor Comercial">
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

      <SaleFormDrawer open={formOpen} onClose={() => setFormOpen(false)} />
      {selectedSaleId && <SaleDetailDrawer open={detailOpen} onClose={() => setDetailOpen(false)} saleId={selectedSaleId} />}
      
      <ImportSalesModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          refetch();
          toast.success('Ventas importadas. Revisá los resultados.');
        }}
        onImport={async (rows, updateStock, paymentResolution, branchId) => {
          return await salesApi.bulkImportSales(rows, updateStock, paymentResolution, branchId);
        }}
      />
    </PageContainer>
  );
}
