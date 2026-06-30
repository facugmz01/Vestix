import { useState } from 'react';
import { PURCHASING_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Truck } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, Tabs
} from '@/components/ui';

import { suppliersApi } from '@/api/suppliers.api';
import { queryKeys } from '@/api/queryKeys';
import type { Supplier } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { SupplierFormDrawer } from '@/features/suppliers/components/SupplierFormDrawer';
import { SupplierDetailDrawer } from '@/features/suppliers/components/SupplierDetailDrawer';
import { ImportBalancesModal } from '@/components/ui/ImportBalancesModal';
import { FileSpreadsheet } from 'lucide-react';
import { useListPage } from '@/hooks/useListPage';
import { useDeleteMutation } from '@/hooks/useDeleteMutation';
import { formatCurrency } from '@/utils/formatCurrency';

export default function SuppliersPage() {
  const { page, pageSize, search, filters, setPage, setSearch, setFilter } = useListPage({ debt: '' });

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const debtFilter = filters.debt;

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.suppliers.all({ page, pageSize, search, hasDebt: debtFilter === 'DEBT' ? true : undefined }),
    queryFn: () => suppliersApi.getSuppliers({ page, pageSize, search, hasDebt: debtFilter === 'DEBT' ? true : undefined }),
  });

  // Delete Mutation
  const deleteMutation = useDeleteMutation({
    mutationFn: (id: string) => suppliersApi.deleteSupplier(id),
    invalidateKey: queryKeys.suppliers.all(),
    successMessage: 'Proveedor eliminado',
    errorMessage: 'Error al eliminar proveedor. Verificá que no tenga órdenes de compra asociadas.',
    onSuccess: () => setDeleteOpen(false),
  });

  // Handlers
  const handleCreate = () => {
    setSelectedSupplier(null);
    setFormOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormOpen(true);
  };

  const handleView = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (supplier: Supplier) => {
    if (supplier.account?.balance > 0) {
      toast.error('No se puede eliminar un proveedor con saldo pendiente a pagar.');
      return;
    }
    setSelectedSupplier(supplier);
    setDeleteOpen(true);
  };

  const suppliers = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer
      tabs={<Tabs items={PURCHASING_TABS} />}
      
      title="Proveedores" 
      subtitle="Gestioná a tus abastecedores y mantené el control de tus cuentas por pagar."
      action={
        <ActionGuard action="manage" subject="Purchasing">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="secondary" 
              icon={<FileSpreadsheet size={16} />} 
              onClick={() => setImportOpen(true)}
            >
              Importar Saldos
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
              Nuevo Proveedor
            </Button>
          </div>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} proveedores</Badge>}>
        <SearchInput placeholder="Buscar por Razón Social o CUIT..." onSearch={setSearch} />
        <select
          value={debtFilter}
          onChange={(e) => { setFilter('debt', e.target.value); }}
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px'
          }}
        >
          <option value="">Todos los Proveedores</option>
          <option value="DEBT">Solo con Deuda (Saldo {'>'} 0)</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : suppliers.length === 0 ? (
          <EmptyState 
            icon={<Truck size={40} />}
            title="No hay proveedores" 
            message="Registrá a tus proveedores para poder emitir Órdenes de Compra e ingresar mercadería." 
          />
        ) : (
          <Table
            keyField="id"
            data={suppliers}
            columns={[
              { 
                key: 'company', 
                header: 'Razón Social',
                render: (s) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{s.companyName}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.taxId || 'Sin CUIT'}</span>
                  </div>
                )
              },
              { 
                key: 'contact', 
                header: 'Contacto',
                render: (s) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px' }}>{s.contactName || '-'}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.email || '-'}</span>
                  </div>
                )
              },
              { 
                key: 'balance', 
                header: 'Saldo (A Pagar)',
                render: (s) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: s.account?.balance > 0 ? 700 : 400, color: s.account?.balance > 0 ? 'var(--red)' : 'var(--text-primary)' }}>
                      {formatCurrency(s.account?.balance || 0, s.account?.currency)}
                    </span>
                  </div>
                )
              },
              {
                key: 'actions',
                header: '',
                render: (s) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(s)} aria-label="Ver" title="Ver ficha y cuenta">
                      <Eye size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Purchasing">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(s)} aria-label="Editar" title="Editar proveedor">
                        <Edit2 size={16} />
                      </Button>
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Purchasing">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePrompt(s)} 
                        aria-label="Eliminar" 
                        title="Eliminar proveedor"
                      >
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

      <SupplierFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        supplierToEdit={selectedSupplier} 
      />
      
      <SupplierDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        supplier={selectedSupplier} 
      />
      
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Proveedor"
        message={`¿Estás seguro de que querés eliminar a "${selectedSupplier?.companyName}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar Definitivamente"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedSupplier && deleteMutation.mutate(selectedSupplier.id)}
        onCancel={() => setDeleteOpen(false)}
      />

      <ImportBalancesModal 
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          refetch();
          toast.success('Saldos importados correctamente');
        }}
        entityName="Proveedor"
        title="Importar Cuentas Corrientes (Acreedores)"
        onImport={async (rows, resolution) => {
          return await suppliersApi.bulkImportBalances(rows, resolution);
        }}
      />
    </PageContainer>
  );
}
