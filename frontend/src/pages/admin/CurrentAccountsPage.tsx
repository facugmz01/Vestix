import { FINANCE_TABS } from '@/navigation/moduleTabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Banknote, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

import { 
  PageContainer, Section, Table, Button, Badge, SearchInput, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, Tabs
} from '@/components/ui';

import { financeApi } from '@/api/finance.api';
import { queryKeys } from '@/api/queryKeys';
import { CurrentAccountDetailDrawer } from '@/features/finance/components/CurrentAccountDetailDrawer';
import { useListPage } from '@/hooks/useListPage';
import { formatCurrency } from '@/utils/formatCurrency';
import clsx from 'clsx';
import adminStyles from '@/styles/AdminListShared.module.css';

export default function CurrentAccountsPage() {
  const { page, pageSize, search, filters, setPage, setSearch, setFilter } = useListPage({ type: '' });

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const typeFilter = filters.type;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.finance.currentAccounts({ page, pageSize, search, entityType: typeFilter }),
    queryFn: () => financeApi.getCurrentAccounts({ page, pageSize, search, entityType: (typeFilter || undefined) as 'CUSTOMER' | 'SUPPLIER' | undefined }),
  });

  const handleView = (id: string) => {
    setSelectedAccountId(id);
    setDetailOpen(true);
  };

  const accounts = data?.data ?? [];
  const total = data?.total ?? 0;



  const mutationOverdue = useMutation({
    mutationFn: () => financeApi.sendOverdueStatements(),
    onSuccess: (res: any) => toast.success(res.message || 'Avisos enviados'),
    onError: () => toast.error('Error al enviar avisos masivos'),
  });

  return (
    <PageContainer
      tabs={<Tabs items={FINANCE_TABS} />}
      
      title="Cuentas Corrientes" 
      subtitle="Saldos y movimientos de clientes y proveedores. Las deudas de compras aparecen acá filtrando Solo Proveedores."
      action={
        <Button variant="outline" icon={<AlertTriangle size={16} />} onClick={() => mutationOverdue.mutate()} loading={mutationOverdue.isPending}>
          Reclamar Deudas
        </Button>
      }
    >
      <FiltersBar actions={<Badge color="gray">{total} cuentas activas</Badge>}>
        <SearchInput placeholder="Buscar por Nombre de Entidad..." onSearch={setSearch} />
        
        <select value={typeFilter} onChange={e => { setFilter('type', e.target.value); }} className={adminStyles.filterSelect}>
          <option value="">Todos (Clientes y Proveedores)</option>
          <option value="CUSTOMER">Solo Clientes (Cobrar)</option>
          <option value="SUPPLIER">Solo Proveedores (Pagar)</option>
        </select>
      </FiltersBar>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : accounts.length === 0 ? (
          <EmptyState 
            icon={<Banknote size={40} />}
            title="Sin Resultados" 
            message="No se encontraron cuentas corrientes con los filtros aplicados." 
          />
        ) : (
          <Table
            keyField="id"
            data={accounts}
            columns={[
              { 
                key: 'entity', 
                header: 'Entidad (Cliente/Proveedor)',
                render: (a) => (
                  <div className={adminStyles.cellStack}>
                    <span className={adminStyles.cellPrimary}>{a.entityName}</span>
                    <span className={adminStyles.cellMuted}>
                      {a.entityType === 'CUSTOMER' ? 'CLIENTE' : 'PROVEEDOR'}
                    </span>
                  </div>
                )
              },
              { 
                key: 'balance', 
                header: 'Saldo Total',
                render: (a) => {
                  const isRed = a.balance > 0; // If they owe us, or we owe them. We highlight non-zero.
                  return <span className={clsx(isRed ? adminStyles.balanceCurrent : adminStyles.balanceCredit)}>{formatCurrency(a.balance)}</span>;
                }
              },
              { 
                key: 'overdue', 
                header: 'Vencido / Exigible',
                render: (a) => {
                  if (a.overdueAmount <= 0) return <span className={adminStyles.textMutedDash}>Al día</span>;
                  return (
                    <div className={adminStyles.balanceOverdue}>
                      <AlertTriangle size={14} /> {formatCurrency(a.overdueAmount)}
                    </div>
                  );
                }
              },
              { 
                key: 'lastMove', 
                header: 'Últ. Movimiento',
                render: (a) => <span className={adminStyles.cellDate}>{a.lastMovementDate ? new Date(a.lastMovementDate).toLocaleDateString() : '-'}</span>
              },
              {
                key: 'actions',
                header: '',
                render: (a) => (
                  <div className={adminStyles.rowActions}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(a.id)} aria-label="Ver Detalles" title="Ver Libro Mayor y Recibos">
                      <FileText size={16} />
                    </Button>
                  </div>
                )
              }
            ]}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <CurrentAccountDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        accountId={selectedAccountId} 
      />

    </PageContainer>
  );
}
