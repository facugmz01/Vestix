import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Users, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog
} from '@/components/ui';

import { customersApi } from '@/api/customers.api';
import { queryKeys } from '@/api/queryKeys';
import type { Customer } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { CustomerFormDrawer } from '@/features/customers/components/CustomerFormDrawer';
import { CustomerDetailDrawer } from '@/features/customers/components/CustomerDetailDrawer';
import { ImportBalancesModal } from '@/components/ui/ImportBalancesModal';
import { FileSpreadsheet } from 'lucide-react';
import { useListPage } from '@/hooks/useListPage';
import { useDeleteMutation } from '@/hooks/useDeleteMutation';
import { formatCurrency } from '@/utils/formatCurrency';

export default function CustomersPage() {
  const { page, pageSize, search, filters, setPage, setSearch, setFilter } = useListPage({ type: '', source: '' });

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const typeFilter = filters.type;
  const sourceFilter = filters.source;

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.customers.all({ page, pageSize, search, type: typeFilter, source: sourceFilter }),
    queryFn: () => customersApi.getCustomers({
      page,
      pageSize,
      search,
      type: (typeFilter || undefined) as any,
      source: (sourceFilter || undefined) as any,
    }),
  });

  // Delete Mutation
  const deleteMutation = useDeleteMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    invalidateKey: queryKeys.customers.all(),
    successMessage: 'Cliente eliminado',
    errorMessage: 'Error al eliminar cliente. Verificá que no tenga historial de deudas o facturas asociadas.',
    onSuccess: () => setDeleteOpen(false),
  });

  // Handlers
  const handleCreate = () => {
    setSelectedCustomer(null);
    setFormOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (customer: Customer) => {
    if (customer.credit.used > 0) {
      toast.error('No se puede eliminar un cliente que posee deuda activa (Cuenta Corriente).');
      return;
    }
    setSelectedCustomer(customer);
    setDeleteOpen(true);
  };

  const customers = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer 
      title="Clientes" 
      subtitle="Gestioná tu cartera de clientes, cuentas corrientes y condiciones comerciales."
      action={
        <ActionGuard action="manage" subject="Customers">
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant="secondary" 
              icon={<FileSpreadsheet size={16} />} 
              onClick={() => setImportOpen(true)}
            >
              Importar Saldos
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
              Nuevo Cliente
            </Button>
          </div>
        </ActionGuard>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} clientes</Badge>}>
        <SearchInput placeholder="Buscar por nombre, teléfono, DNI o CUIT..." onSearch={setSearch} />
        <select
          value={typeFilter}
          onChange={(e) => { setFilter('type', e.target.value); }}
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px'
          }}
        >
          <option value="">Todos los Tipos</option>
          <option value="INDIVIDUAL">Individuos (B2C)</option>
          <option value="BUSINESS">Empresas (B2B)</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => { setFilter('source', e.target.value); }}
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
            background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px'
          }}
        >
          <option value="">Todos los orígenes</option>
          <option value="ADMIN">Backoffice</option>
          <option value="STOREFRONT">Tienda online</option>
          <option value="POS">POS</option>
          <option value="IMPORT">Importación</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : customers.length === 0 ? (
          <EmptyState 
            icon={<Users size={40} />}
            title="No hay clientes" 
            message="Comenzá a registrar a tus clientes para poder fidelizarlos y ofrecerles líneas de crédito." 
          />
        ) : (
          <Table
            keyField="id"
            data={customers}
            columns={[
              { 
                key: 'fullName', 
                header: 'Cliente',
                render: (c) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{c.fullName}</span>
                      {c.source === 'STOREFRONT' && <Badge color="green">Tienda</Badge>}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.taxId || 'Sin ID'}</span>
                  </div>
                )
              },
              { 
                key: 'type', 
                header: 'Tipo',
                render: (c) => <Badge color={c.type === 'BUSINESS' ? 'blue' : 'gray'}>{c.type === 'BUSINESS' ? 'B2B' : 'B2C'}</Badge>
              },
              {
                key: 'source',
                header: 'Origen',
                render: (c) => {
                  const labels: Record<string, { label: string; color: 'green' | 'blue' | 'gray' | 'purple' }> = {
                    STOREFRONT: { label: 'Tienda online', color: 'green' },
                    POS: { label: 'POS', color: 'blue' },
                    IMPORT: { label: 'Importación', color: 'purple' },
                    ADMIN: { label: 'Backoffice', color: 'gray' },
                  };
                  const meta = labels[c.source || 'ADMIN'] || labels.ADMIN;
                  return <Badge color={meta.color}>{meta.label}</Badge>;
                }
              },
              { 
                key: 'contact', 
                header: 'Contacto',
                render: (c) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px' }}>{c.email || '-'}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{c.phone || '-'}</span>
                  </div>
                )
              },
              { 
                key: 'credit', 
                header: 'Cta. Cte.',
                render: (c) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {c.credit.limit > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '13px', fontWeight: c.credit.used > 0 ? 600 : 400, color: c.credit.used > 0 ? 'var(--red)' : 'var(--text-primary)' }}>
                          Deuda: {formatCurrency(c.credit.used)}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Límite: {formatCurrency(c.credit.limit)}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Contado</span>
                    )}
                    {c.credit.onHold && <AlertCircle size={14} color="var(--red)" />}
                  </div>
                )
              },
              {
                key: 'actions',
                header: '',
                render: (c) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(c)} aria-label="Ver" title="Ver ficha">
                      <Eye size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Customers">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} aria-label="Editar" title="Editar cliente">
                        <Edit2 size={16} />
                      </Button>
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Customers">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePrompt(c)} 
                        aria-label="Eliminar" 
                        title="Eliminar cliente"
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

      <CustomerFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        customerToEdit={selectedCustomer} 
      />
      
      <CustomerDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        customer={selectedCustomer} 
      />
      
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Cliente"
        message={`¿Estás seguro de que querés eliminar a "${selectedCustomer?.fullName}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar Definitivamente"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedCustomer && deleteMutation.mutate(selectedCustomer.id)}
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
        entityName="Cliente"
        title="Importar Cuentas Corrientes (Deudores)"
        onImport={async (rows, resolution) => {
          return await customersApi.bulkImportBalances(rows, resolution);
        }}
      />
    </PageContainer>
  );
}
