import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

import { CATALOG_TABS } from '@/navigation/moduleTabs';
import {
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar,
  EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, ActiveChip, Tabs,
} from '@/components/ui';
import { collectionsApi, type ProductCollection } from '@/api/collections.api';
import { queryKeys } from '@/api/queryKeys';
import { ActionGuard } from '@/rbac/ActionGuard';
import { CollectionFormDrawer } from '@/features/catalog/components/CollectionFormDrawer';
import adminStyles from '@/styles/AdminListShared.module.css';

export default function CollectionsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ProductCollection | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.collections.all({ activeOnly }),
    queryFn: () => collectionsApi.getAll(activeOnly),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => collectionsApi.remove(id),
    onSuccess: () => {
      toast.success('Colección eliminada');
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all() });
      setDeleteOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || 'Error al eliminar'),
  });

  const collections = (data ?? []).filter(c =>
    !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.season ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageContainer
      tabs={<Tabs items={CATALOG_TABS} />}
      title="Colecciones y Temporadas"
      subtitle="Agrupá productos por temporada, campaña o colección de indumentaria."
      action={
        <ActionGuard action="create" subject="Catalog">
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => { setSelected(null); setFormOpen(true); }}>
            Nueva Colección
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{collections.length} colecciones</Badge>}>
        <SearchInput placeholder="Buscar por nombre o temporada..." onSearch={setSearch} />
        <label className={adminStyles.filterCheckbox}>
          <input type="checkbox" checked={activeOnly} onChange={e => setActiveOnly(e.target.checked)} />
          Solo activas
        </label>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : collections.length === 0 ? (
          <EmptyState icon={<Layers size={40} />} title="Sin colecciones" description="Creá tu primera colección para organizar el catálogo por temporada." />
        ) : (
          <Table
            columns={[
              { key: 'name', label: 'Nombre', render: (c: ProductCollection) => <strong>{c.name}</strong> },
              { key: 'season', label: 'Temporada', render: (c: ProductCollection) => c.season || '—' },
              { key: 'year', label: 'Año', render: (c: ProductCollection) => c.year ?? '—' },
              { key: 'products', label: 'Productos', render: (c: ProductCollection) => c._count?.products ?? c.products?.length ?? 0 },
              { key: 'status', label: 'Estado', render: (c: ProductCollection) => (
                <ActiveChip active={c.isActive} />
              )},
              { key: 'actions', label: '', render: (c: ProductCollection) => (
                <div className={adminStyles.rowActions}>
                  <ActionGuard action="update" subject="Catalog">
                    <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => { setSelected(c); setFormOpen(true); }} />
                  </ActionGuard>
                  <ActionGuard action="delete" subject="Catalog">
                    <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => { setSelected(c); setDeleteOpen(true); }} />
                  </ActionGuard>
                </div>
              )},
            ]}
            data={collections}
            keyExtractor={(c: ProductCollection) => c.id}
          />
        )}
      </Section>

      <CollectionFormDrawer open={formOpen} onClose={() => setFormOpen(false)} collectionToEdit={selected} />

      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar colección"
        message={`¿Eliminar "${selected?.name}"? Los productos no se borran, solo se desvinculan.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selected && deleteMutation.mutate(selected.id)}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}
