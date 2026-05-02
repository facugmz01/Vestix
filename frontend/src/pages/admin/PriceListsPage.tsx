import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Tag, Users } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, 
  SearchInput, FiltersBar, Pagination, EmptyState, 
  ApiErrorDisplay, TableSkeleton, ConfirmDialog, StatusChip
} from '@/components/ui';

import { priceListsApi } from '@/api/priceLists.api';
import { queryKeys } from '@/api/queryKeys';
import type { PriceList } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { PriceListFormDrawer } from '@/features/priceLists/components/PriceListFormDrawer';
import { PriceListDetailDrawer } from '@/features/priceLists/components/PriceListDetailDrawer';

export default function PriceListsPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [pageSize] = useState(15);

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<PriceList | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.priceLists.all({ page, pageSize, search, type: typeFilter }),
    queryFn: () => priceListsApi.getPriceLists({ page, pageSize, search, type: typeFilter as any }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => priceListsApi.deletePriceList(id),
    onSuccess: () => {
      toast.success('Lista eliminada');
      queryClient.invalidateQueries({ queryKey: queryKeys.priceLists.all() });
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar. Verificá que no esté asignada a clientes.');
    }
  });

  const handleCreate = () => {
    setSelectedList(null);
    setFormOpen(true);
  };

  const handleEdit = (list: PriceList) => {
    setSelectedList(list);
    setFormOpen(true);
  };

  const handleView = (list: PriceList) => {
    setSelectedList(list);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (list: PriceList) => {
    setSelectedList(list);
    setDeleteOpen(true);
  };

  const handleAssign = (list: PriceList) => {
    // Mock action since we don't have a full Assign UI implemented in this turn
    toast('La asignación a clientes se realiza desde la ficha de cada Cliente (CRM).', { icon: 'ℹ️' });
  };

  const lists = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer 
      title="Listas de Precios" 
      subtitle="Gestioná matrices de precios y reglas comerciales (descuentos, recargos)."
      action={
        <ActionGuard action="manage" subject="Catalog">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nueva Lista
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} listas</Badge>}>
        <SearchInput placeholder="Buscar por nombre o código..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
        >
          <option value="">Todos los Tipos</option>
          <option value="BASE">Base (Precios fijos)</option>
          <option value="MODIFIER">Modificadoras (%)</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : lists.length === 0 ? (
          <EmptyState 
            icon={<Tag size={40} />}
            title="No hay listas de precios" 
            message="Creá listas bases o modificadoras para asignar a tus clientes o sucursales." 
          />
        ) : (
          <Table
            keyField="id"
            data={lists}
            columns={[
              { 
                key: 'name', 
                header: 'Nombre / Código',
                render: (l) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{l.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{l.code}</span>
                  </div>
                )
              },
              { 
                key: 'type', 
                header: 'Tipo',
                render: (l) => l.type === 'BASE' 
                  ? <Badge color="blue">BASE</Badge> 
                  : <Badge color="purple">MODIFICADOR</Badge>
              },
              { 
                key: 'rule', 
                header: 'Regla',
                render: (l) => l.type === 'MODIFIER' 
                  ? <span style={{ fontWeight: 600, color: (l.modifierPercentage || 0) < 0 ? 'var(--red)' : 'var(--green)' }}>{l.modifierPercentage}%</span> 
                  : <span style={{ color: 'var(--text-muted)' }}>Fija (Override)</span>
              },
              { 
                key: 'currency', 
                header: 'Moneda',
                render: (l) => <span style={{ fontWeight: 500 }}>{l.currency}</span>
              },
              { 
                key: 'isActive', 
                header: 'Estado',
                render: (l) => <StatusChip label={l.isActive ? 'Activa' : 'Inactiva'} color={l.isActive ? 'green' : 'gray'} />
              },
              {
                key: 'actions',
                header: '',
                render: (l) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <ActionGuard action="manage" subject="Customers">
                      <Button variant="ghost" size="sm" onClick={() => handleAssign(l)} aria-label="Asignar" title="Asignar a Clientes">
                        <Users size={16} />
                      </Button>
                    </ActionGuard>
                    <Button variant="ghost" size="sm" onClick={() => handleView(l)} aria-label="Ver Matriz" title="Ver matriz de precios">
                      <Eye size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(l)} aria-label="Editar" title="Editar lista">
                        <Edit2 size={16} />
                      </Button>
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button variant="ghost" size="sm" onClick={() => handleDeletePrompt(l)} aria-label="Eliminar">
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

      <PriceListFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        listToEdit={selectedList} 
      />
      
      <PriceListDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        priceList={selectedList} 
      />
      
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Lista de Precios"
        message={`¿Estás seguro de que querés eliminar "${selectedList?.name}"? Se perderán todas las excepciones de precios y fallará si hay clientes asignados a esta lista.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedList && deleteMutation.mutate(selectedList.id)}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}
