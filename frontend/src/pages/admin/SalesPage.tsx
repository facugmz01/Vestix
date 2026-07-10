import { SALES_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, ShoppingCart, PackageCheck, CheckCircle, CreditCard, XCircle, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
import { formatSaleId } from '@/utils/formatId';
import { useState } from 'react';
import type { SaleOrder } from '@/types';
import adminStyles from '@/styles/AdminListShared.module.css';

function isHomeDelivery(sale: SaleOrder) {
  return !!sale.shippingAddress;
}

export default function SalesPage() {
  const navigate = useNavigate();
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
      toast.error(err?.message || 'Error al actualizar estado');
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
      case 'COMPLETED': return 'green';
      case 'READY_FOR_PICKUP': return 'purple';
      case 'SHIPPED': return 'purple';
      case 'DELIVERED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const statusLabels: Record<string, string> = {
    QUOTATION: 'Presupuesto',
    PENDING_PAYMENT: 'Pago Pendiente',
    CONFIRMED: 'Confirmado',
    COMPLETED: 'Completado',
    READY_FOR_PICKUP: 'Listo P/Retiro',
    SHIPPED: 'En Tránsito',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  };

  const handleConfirmPayment = async (id: string) => {
    if (!window.confirm('¿Validar el pago y confirmar esta venta?')) return;
    const ref = window.prompt('Referencia de pago (opcional, ej. nº de transferencia):');
    try {
      await salesApi.confirmPayment(id, { paymentReference: ref?.trim() || undefined });
      toast.success('Pago validado correctamente');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Error al validar el pago');
    }
  };

  const handleCancelSale = async (id: string, status: string) => {
    const messages: Record<string, string> = {
      PENDING_PAYMENT: '¿Cancelar esta venta con pago pendiente?',
      CONFIRMED: '¿Anular esta venta confirmada?',
      COMPLETED: '¿Anular esta venta completada?',
      READY_FOR_PICKUP: '¿Anular esta venta lista para retiro?',
      SHIPPED: '¿Anular esta venta en tránsito?',
      DELIVERED: '¿Anular esta venta ya entregada?',
    };
    if (!window.confirm(messages[status] || '¿Cancelar este documento?')) return;
    try {
      await salesApi.cancelSale(id);
      toast.success('Documento cancelado');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Error al cancelar');
    }
  };

  const cancellableStatuses = ['PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'READY_FOR_PICKUP', 'DELIVERED'];

  return (
    <PageContainer
      tabs={<Tabs items={SALES_TABS} />}
      
      title="Operaciones de Venta (Backoffice)" 
      subtitle="Monitor general de ventas confirmadas y presupuestos (Quotations) generados en todas las sucursales."
      action={
        <ActionGuard action="manage" subject="Sales">
          <div className={adminStyles.toolbarActions}>
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
        
        <select value={statusFilter} onChange={e => { setFilter('status', e.target.value); }} className={adminStyles.filterSelect}>
          <option value="">Todos los Estados</option>
          <option value="QUOTATION">Solo Presupuestos</option>
          <option value="PENDING_PAYMENT">Pago Pendiente</option>
          <option value="CONFIRMED">Ventas Confirmadas</option>
          <option value="COMPLETED">Ventas Completadas (POS)</option>
          <option value="READY_FOR_PICKUP">Listos para Retiro</option>
          <option value="SHIPPED">En Tránsito</option>
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
                  <span className={adminStyles.cellMonoBold}>
                    {formatSaleId(s.id, s.status)}
                  </span>
                )
              },
              { 
                key: 'date', 
                header: 'Fecha',
                render: (s) => <span className={adminStyles.cellDate}>{new Date(s.createdAt).toLocaleDateString()}</span>
              },
              { 
                key: 'source', 
                header: 'Canal',
                render: (s) => (
                  <div className={adminStyles.cellRowXs}>
                    <Badge color="gray">
                      {s.source}
                    </Badge>
                  </div>
                )
              },
              { 
                key: 'customer', 
                header: 'Cliente',
                render: (s) => <span className={adminStyles.cellMedium}>{s.customerName || 'Consumidor Final'}</span>
              },
              { 
                key: 'payment', 
                header: 'Condición',
                render: (s) => {
                  const names: any = { CASH: 'Efectivo', CREDIT_CARD: 'Tarjeta', BANK_TRANSFER: 'Transferencia', CUSTOMER_CREDIT: 'Cta. Corriente' };
                  return <span className={adminStyles.cellSecondaryMuted}>{names[s.paymentMethod] || s.paymentMethod}</span>
                }
              },
              { 
                key: 'total', 
                header: 'Monto Final',
                render: (s) => <span className={adminStyles.cellAmount}>{formatCurrency(s.grandTotal)}</span>
              },
              { 
                key: 'status', 
                header: 'Estado Comercial',
                render: (s) => (
                  <StatusChip label={statusLabels[s.status] || s.status} color={getStatusColor(s.status) as any} />
                )
              },
              {
                key: 'actions',
                header: '',
                render: (s) => {
                  const homeDelivery = isHomeDelivery(s);
                  return (
                  <div className={adminStyles.rowActions}>
                    {s.status === 'PENDING_PAYMENT' && (
                      <ActionGuard action="update" subject="Sales">
                        <Button variant="primary" size="sm" onClick={() => handleConfirmPayment(s.id)} aria-label="Validar Pago" title="Validar Pago y Confirmar">
                          <CreditCard size={16} />
                        </Button>
                      </ActionGuard>
                    )}
                    {!homeDelivery && (s.status === 'CONFIRMED' || s.status === 'COMPLETED') && (
                      <Button variant="secondary" size="sm" onClick={() => updateStatus(s.id, 'READY_FOR_PICKUP')} aria-label="Listo para Retiro" title="Marcar Listo para Retiro">
                        <PackageCheck size={16} />
                      </Button>
                    )}
                    {!homeDelivery && s.status === 'READY_FOR_PICKUP' && (
                      <Button variant="primary" size="sm" onClick={() => updateStatus(s.id, 'DELIVERED')} aria-label="Entregado" title="Marcar Entregado">
                        <CheckCircle size={16} />
                      </Button>
                    )}
                    {homeDelivery && (s.status === 'CONFIRMED' || s.status === 'COMPLETED' || s.status === 'SHIPPED') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate('/admin/delivery')}
                        aria-label="Gestionar envío"
                        title="Gestionar en Envíos y Despacho"
                      >
                        <Truck size={16} />
                      </Button>
                    )}
                    {cancellableStatuses.includes(s.status) && (
                      <ActionGuard action="update" subject="Sales">
                        <Button variant="ghost" size="sm" onClick={() => handleCancelSale(s.id, s.status)} aria-label="Cancelar" title="Cancelar / Anular venta">
                          <XCircle size={16} />
                        </Button>
                      </ActionGuard>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleView(s.id)} aria-label="Ver Detalles" title="Abrir Visor Comercial">
                      <Eye size={16} />
                    </Button>
                  </div>
                  );
                }
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
