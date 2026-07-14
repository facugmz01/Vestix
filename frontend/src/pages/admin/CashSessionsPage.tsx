import { FINANCE_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Eye, Wallet, CheckCircle } from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, StatusChip, Tabs
} from '@/components/ui';

import { treasuryApi } from '@/api/treasury.api';
import { financeApi } from '@/api/finance.api';
import { queryKeys } from '@/api/queryKeys';

import { CashSessionDetailDrawer } from '@/features/finance/components/CashSessionDetailDrawer';
import { TreasuryAccountDetailDrawer } from '@/features/finance/components/TreasuryAccountDetailDrawer';
import { useListPage } from '@/hooks/useListPage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatShortId } from '@/utils/formatId';
import { useState } from 'react';
import adminStyles from '@/styles/AdminListShared.module.css';

export default function CashSessionsPage() {
  const { page, pageSize, filters, setPage, setFilter } = useListPage({ status: '' });

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const statusFilter = filters.status;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.treasury.shifts({ page, pageSize, status: statusFilter }),
    queryFn: () => treasuryApi.getShifts({ page, pageSize, status: statusFilter }),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['treasury', 'accounts'],
    queryFn: () => financeApi.getTreasuryAccounts(),
  });

  const handleView = (id: string) => {
    setSelectedShiftId(id);
    setDetailOpen(true);
  };

  const handleViewAccount = (id: string) => {
    setSelectedAccountId(id);
    setAccountDrawerOpen(true);
  };

  const shifts = data?.data ?? [];
  const total = data?.total ?? 0;
  const accountList = Array.isArray(accounts) ? accounts : [];

  return (
    <PageContainer
      tabs={<Tabs items={FINANCE_TABS} />}
      
      title="Tesorería y Arqueos (Cash Shifts)" 
      subtitle="Saldos de cuentas (caja/banco) y sesiones de caja. Los pagos a proveedores impactan estos saldos."
    >
      <Section title="Cuentas de tesorería">
        {accountList.length === 0 ? (
          <EmptyState
            icon={<Wallet size={40} />}
            title="Sin cuentas"
            message="No hay cuentas financieras activas. Creá una caja o banco para registrar pagos de compras."
          />
        ) : (
          <Table
            keyField="id"
            data={accountList}
            columns={[
              {
                key: 'name',
                header: 'Cuenta',
                render: (a) => (
                  <div className={adminStyles.cellStack}>
                    <span className={adminStyles.cellPrimary}>{a.name}</span>
                    <span className={adminStyles.cellMuted}>{a.type}</span>
                  </div>
                ),
              },
              {
                key: 'balance',
                header: 'Saldo actual',
                render: (a) => <span className={adminStyles.textBold800}>{formatCurrency(a.balance)}</span>,
              },
              {
                key: 'actions',
                header: '',
                render: (a) => (
                  <div className={adminStyles.rowActions}>
                    <Button variant="ghost" size="sm" onClick={() => handleViewAccount(a.id)} aria-label="Ver movimientos">
                      <Eye size={16} />
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Section>

      <FiltersBar actions={<Badge color="gray">{total} sesiones</Badge>}>
        <select value={statusFilter} onChange={e => { setFilter('status', e.target.value); }} className={adminStyles.filterSelect}>
          <option value="">Todos los Turnos</option>
          <option value="OPEN">Turnos Abiertos (Operando)</option>
          <option value="CLOSED">Turnos Cerrados (Arqueados)</option>
        </select>
      </FiltersBar>

      <Section title="Sesiones de caja">
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : shifts.length === 0 ? (
          <EmptyState 
            icon={<Wallet size={40} />}
            title="Sin Registros" 
            message="No hay sesiones de caja registradas." 
          />
        ) : (
          <Table
            keyField="id"
            data={shifts}
            columns={[
              { 
                key: 'id', 
                header: 'Turno ID',
                render: (s) => <span className={adminStyles.cellMonoBold}>{formatShortId(s.id)}</span>
              },
              { 
                key: 'account', 
                header: 'Caja Física',
                render: (s) => <span className={adminStyles.cellMedium}>{s.accountName || 'Caja Registradora'}</span>
              },
              { 
                key: 'openTime', 
                header: 'Apertura',
                render: (s) => <span className={adminStyles.cellDate}>{new Date(s.openedAt).toLocaleString()}</span>
              },
              { 
                key: 'operator', 
                header: 'Operador',
                render: (s) => <span className={adminStyles.textSecondary}>{s.openedByUserName}</span>
              },
              { 
                key: 'diff', 
                header: 'Diferencia de Arqueo',
                render: (s) => {
                  if (s.status === 'OPEN') return <span className={adminStyles.textMutedDash}>Operando...</span>;
                  const diff = s.difference || 0;
                  if (diff === 0) return <Badge color="green"><CheckCircle size={12} /> Exacto</Badge>;
                  return <Badge color={diff < 0 ? 'red' : 'yellow'}>{diff < 0 ? 'Faltante' : 'Sobrante'} {formatCurrency(diff)}</Badge>;
                }
              },
              { 
                key: 'status', 
                header: 'Estado',
                render: (s) => <StatusChip label={s.status === 'OPEN' ? 'Abierto' : 'Cerrado'} color={s.status === 'OPEN' ? 'green' : 'gray'} />
              },
              {
                key: 'actions',
                header: '',
                render: (s) => (
                  <div className={adminStyles.rowActions}>
                    <Button variant="ghost" size="sm" onClick={() => handleView(s.id)} aria-label="Ver Auditoría">
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

      <CashSessionDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        shiftId={selectedShiftId} 
      />

      <TreasuryAccountDetailDrawer
        open={accountDrawerOpen}
        onClose={() => setAccountDrawerOpen(false)}
        accountId={selectedAccountId}
      />
    </PageContainer>
  );
}
