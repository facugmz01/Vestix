import { useState , Tabs } from 'react';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Zap, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, 
  SearchInput, FiltersBar, Pagination, EmptyState, 
  ApiErrorDisplay, TableSkeleton, ConfirmDialog, StatusChip
} from '@/components/ui';

import { promotionsApi } from '@/api/promotions.api';
import { queryKeys } from '@/api/queryKeys';
import type { Promotion } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { PromotionFormDrawer } from '@/features/promotions/components/PromotionFormDrawer';
import { PromotionDetailDrawer } from '@/features/promotions/components/PromotionDetailDrawer';
import { BulkPriceUpdateModal } from '@/features/promotions/components/BulkPriceUpdateModal';

export default function PromotionsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [pageSize] = useState(15);

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.promotions.all({ page, pageSize, search }),
    queryFn: () => promotionsApi.getPromotions({ page, pageSize, search }),
  });

  const { data: conflictsData } = useQuery({
    queryKey: queryKeys.promotions.conflicts(),
    queryFn: () => promotionsApi.getConflicts(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promotionsApi.deletePromotion(id),
    onSuccess: () => {
      toast.success('Promoción eliminada');
      queryClient.invalidateQueries({ queryKey: queryKeys.promotions.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.promotions.conflicts() });
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar promoción.');
    }
  });

  const handleCreate = () => {
    setSelectedPromo(null);
    setFormOpen(true);
  };

  const handleEdit = (promo: Promotion) => {
    setSelectedPromo(promo);
    setFormOpen(true);
  };

  const handleView = (promo: Promotion) => {
    setSelectedPromo(promo);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (promo: Promotion) => {
    setSelectedPromo(promo);
    setDeleteOpen(true);
  };

  const promos = data?.data ?? [];
  const total = data?.total ?? 0;
  const activeConflicts = conflictsData || [];

  return (
    <PageContainer
      tabs={<Tabs items={CATALOG_TABS} />}
      
      title="Promociones y Reglas de Precio" 
      subtitle="Definí descuentos temporales, 2x1 y analizá el impacto en tu rentabilidad."
      action={
        <div style={{ display: 'flex', gap: '8px' }}>
          <ActionGuard action="manage" subject="Catalog">
            <Button variant="secondary" icon={<Zap size={16} />} onClick={() => setBulkOpen(true)}>
              Modificación Masiva
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
              Nueva Promoción
            </Button>
          </ActionGuard>
        </div>
      }
    >
      {activeConflicts.length > 0 && (
        <div style={{ padding: '16px', marginBottom: '24px', background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle color="var(--red)" size={24} />
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--red)' }}>Atención: Conflictos Activos</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>
              Existen {activeConflicts.length} solapamientos de promociones detectados por el motor de precios. Revisá las condiciones para evitar descuentos indeseados en el POS.
            </p>
          </div>
        </div>
      )}

      <FiltersBar actions={<Badge color="gray">{total} reglas</Badge>}>
        <SearchInput placeholder="Buscar por nombre..." onSearch={(val) => { setSearch(val); setPage(1); }} />
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : promos.length === 0 ? (
          <EmptyState 
            title="Sin promociones" 
            message="No hay promociones activas en este momento." 
          />
        ) : (
          <Table
            keyField="id"
            data={promos}
            columns={[
              { 
                key: 'name', 
                header: 'Promoción',
                render: (p) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                    {(p.conflictsWith?.length || 0) > 0 && <AlertCircle size={14} color="var(--red)" />}
                  </div>
                )
              },
              { 
                key: 'type', 
                header: 'Tipo',
                render: (p) => <Badge color="blue">{p.type}</Badge>
              },
              { 
                key: 'value', 
                header: 'Valor',
                render: (p) => <span style={{ fontWeight: 600 }}>{p.type.includes('PERCENTAGE') ? `${p.value}%` : p.value}</span>
              },
              { 
                key: 'scope', 
                header: 'Alcance',
                render: (p) => <span style={{ fontSize: '13px' }}>{p.applicableTo.type}</span>
              },
              { 
                key: 'dates', 
                header: 'Vigencia',
                render: (p) => (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(p.startDate).toLocaleDateString()} - {p.endDate ? new Date(p.endDate).toLocaleDateString() : 'Indef.'}
                  </span>
                )
              },
              { 
                key: 'isActive', 
                header: 'Estado',
                render: (p) => <StatusChip label={p.isActive ? 'Activa' : 'Inactiva'} color={p.isActive ? 'green' : 'gray'} />
              },
              {
                key: 'actions',
                header: '',
                render: (p) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(p)} aria-label="Analizar Impacto" title="Ver análisis de impacto">
                      <Eye size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} aria-label="Editar">
                        <Edit2 size={16} />
                      </Button>
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePrompt(p)} aria-label="Eliminar">
                        <Trash2 size={16} color="var(--red)" />
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

      <PromotionFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        promoToEdit={selectedPromo} 
      />
      
      <PromotionDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        promotion={selectedPromo} 
      />

      <BulkPriceUpdateModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
      />
      
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Promoción"
        message={`¿Estás seguro de que querés eliminar "${selectedPromo?.name}"? Dejará de aplicarse inmediatamente en el Punto de Venta.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedPromo && deleteMutation.mutate(selectedPromo.id)}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}
