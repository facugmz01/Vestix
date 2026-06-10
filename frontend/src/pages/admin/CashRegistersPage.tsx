import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, StatusChip, Tabs
} from '@/components/ui';

import { cashRegistersApi } from '@/api/cashRegisters.api';
import { queryKeys } from '@/api/queryKeys';
import type { CashRegister } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { CashRegisterFormDrawer } from '@/features/cashRegisters/components/CashRegisterFormDrawer';
import { CashRegisterDetailDrawer } from '@/features/cashRegisters/components/CashRegisterDetailDrawer';

export default function CashRegistersPage() {
  const queryClient = useQueryClient();

  // States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize] = useState(15);

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.cashRegisters.all({ page, pageSize, search, status: statusFilter }),
    queryFn: () => cashRegistersApi.getCashRegisters({ page, pageSize, search, status: statusFilter }),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => cashRegistersApi.deleteCashRegister(id),
    onSuccess: () => {
      toast.success('Caja eliminada');
      queryClient.invalidateQueries({ queryKey: queryKeys.cashRegisters.all() });
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar caja.');
    }
  });

  // Handlers
  const handleCreate = () => {
    setSelectedRegister(null);
    setFormOpen(true);
  };

  const handleEdit = (reg: CashRegister) => {
    setSelectedRegister(reg);
    setFormOpen(true);
  };

  const handleView = (reg: CashRegister) => {
    setSelectedRegister(reg);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (reg: CashRegister) => {
    if (reg.status === 'OPEN') {
      toast.error('No se puede eliminar una caja que se encuentra abierta. Por favor, cerrá el turno primero.');
      return;
    }
    setSelectedRegister(reg);
    setDeleteOpen(true);
  };

  const registers = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer 
      title="Cajas Registradoras" 
      subtitle="Administrá las terminales de venta (POS) y visualizá su estado actual."
      action={
        <ActionGuard action="manage" subject="Settings">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nueva Caja
          </Button>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} cajas</Badge>}>
        <SearchInput placeholder="Buscar por nombre..." onSearch={(val) => { setSearch(val); setPage(1); }} />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px'
          }}
        >
          <option value="">Todos los estados</option>
          <option value="OPEN">Abiertas</option>
          <option value="CLOSED">Cerradas</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : registers.length === 0 ? (
          <EmptyState 
            icon={<Monitor size={40} />}
            title="No hay cajas registradas" 
            message="Creá tu primera caja para poder iniciar turnos y registrar ventas desde el Punto de Venta." 
          />
        ) : (
          <Table
            keyField="id"
            data={registers}
            columns={[
              { 
                key: 'name', 
                header: 'Nombre',
                render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span>
              },
              { 
                key: 'branch', 
                header: 'Sucursal',
                render: (r) => <span style={{ color: 'var(--text-secondary)' }}>{r.branchName || r.branchId}</span>
              },
              { 
                key: 'status', 
                header: 'Estado Actual',
                render: (r) => r.status === 'OPEN' 
                  ? <StatusChip label="Abierta" color="green" /> 
                  : <StatusChip label="Cerrada" color="gray" />
              },
              { 
                key: 'operator', 
                header: 'Operador',
                render: (r) => r.status === 'OPEN' && r.operatorName 
                  ? <span style={{ fontSize: '13px', fontWeight: 500 }}>{r.operatorName}</span> 
                  : <span style={{ color: 'var(--text-muted)' }}>-</span>
              },
              { 
                key: 'isActive', 
                header: 'Activa',
                render: (r) => <Badge color={r.isActive ? "blue" : "gray"}>{r.isActive ? "Sí" : "No"}</Badge>
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(r)} aria-label="Ver" title="Ver detalle">
                      <Eye size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Settings">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(r)} aria-label="Editar" title="Editar caja">
                        <Edit2 size={16} />
                      </Button>
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Settings">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePrompt(r)} 
                        disabled={r.status === 'OPEN'}
                        aria-label="Eliminar" 
                        title={r.status === 'OPEN' ? "Caja abierta (no se puede eliminar)" : "Eliminar caja"}
                      >
                        <Trash2 size={16} color={r.status === 'OPEN' ? "var(--text-muted)" : "var(--red)"} />
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

      <CashRegisterFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        registerToEdit={selectedRegister} 
      />
      
      <CashRegisterDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        register={selectedRegister} 
      />
      
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Caja"
        message={`¿Estás seguro de que querés eliminar la caja "${selectedRegister?.name}"? Esta acción borrará la terminal del sistema (pero no su historial financiero).`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedRegister && deleteMutation.mutate(selectedRegister.id)}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}
