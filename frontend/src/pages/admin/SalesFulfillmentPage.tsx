import { useState } from 'react';
import { SALES_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Package, Search, Filter, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, EmptyState, ApiErrorDisplay, TableSkeleton, StatusChip, Tabs
} from '@/components/ui';

import { salesApi } from '@/api/sales.api';
import { queryKeys } from '@/api/queryKeys';
import { SaleDetailDrawer } from '@/features/sales/components/SaleDetailDrawer';

export default function SalesFulfillmentPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState('');
  
  // We only care about pending fulfillment for web sales
  const [statusFilter, setStatusFilter] = useState<'PENDING_PAYMENT' | 'CONFIRMED' | 'READY_FOR_PICKUP'>('CONFIRMED');

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.sales.all({ page, pageSize, search, status: statusFilter }),
    queryFn: () => salesApi.getSales({ page, pageSize, search, status: statusFilter }),
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await salesApi.updateStatus(id, status);
      toast.success('Pedido actualizado a: ' + status);
      refetch();
    } catch (err: any) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleView = (id: string) => { setSelectedSaleId(id); setDetailOpen(true); };

  // Filter to show mostly web orders
  const sales = data?.data?.filter(s => s.source === 'ECOMMERCE') ?? [];

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'PENDING_PAYMENT': return 'yellow';
      case 'CONFIRMED': return 'blue';
      case 'READY_FOR_PICKUP': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <PageContainer
      tabs={<Tabs items={SALES_TABS} />}
      title="Pick & Pack (Preparación Tienda Web)" 
      subtitle="Visualiza y prepara los pedidos provenientes del e-commerce."
    >
      <FiltersBar actions={<Badge color="blue">{sales.length} pedidos web</Badge>}>
        <SearchInput placeholder="Buscar por ID..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="CONFIRMED">Por Preparar (Confirmados)</option>
          <option value="READY_FOR_PICKUP">Listos para Retiro / Envío</option>
          <option value="PENDING_PAYMENT">Pago Pendiente</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : sales.length === 0 ? (
          <EmptyState 
            icon={<ShoppingBag size={40} />}
            title="Sin pedidos web pendientes" 
            message={`No hay pedidos en estado ${statusFilter} para armar.`}
          />
        ) : (
          <Table
            keyField="id"
            data={sales}
            columns={[
              { 
                key: 'id',
                header: 'ID / Fecha', 
                render: (s: any) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.id.split('-')[0]}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>
                )
              },
              { 
                key: 'customer',
                header: 'Cliente', 
                render: (s: any) => s.customerName ? `${s.customerName}` : 'Consumidor Final'
              },
              { 
                key: 'items',
                header: 'Artículos', 
                render: (s: any) => `${s.lines?.reduce((acc: number, l: any) => acc + l.quantity, 0) || 0} ítems`
              },
              { 
                key: 'shipping',
                header: 'Entrega', 
                render: (s: any) => <Badge color="blue">Tienda Online</Badge>
              },
              { 
                key: 'status',
                header: 'Estado', 
                render: (s: any) => <StatusChip label={s.status} color={getStatusColor(s.status) as any} />
              },
              {
                key: 'actions',
                header: 'Acciones',
                render: (s: any) => (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="secondary" size="sm" onClick={() => handleView(s.id)}>Detalle</Button>
                    {s.status === 'CONFIRMED' && (
                      <Button variant="primary" size="sm" onClick={() => updateStatus(s.id, 'READY_FOR_PICKUP')}>
                        Listo para Retiro
                      </Button>
                    )}
                    {s.status === 'READY_FOR_PICKUP' && (
                      <Button variant="primary" size="sm" onClick={() => updateStatus(s.id, 'DELIVERED')}>
                        Entregar al Cliente
                      </Button>
                    )}
                  </div>
                )
              }
            ]}
          />
        )}
      </Section>

      {/* Sale Detail Drawer */}
      {selectedSaleId && (
        <SaleDetailDrawer
          open={detailOpen}
          saleId={selectedSaleId}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </PageContainer>
  );
}
