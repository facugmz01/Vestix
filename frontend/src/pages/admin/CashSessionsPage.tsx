import { useState } from 'react';
import { FINANCE_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { Eye, Wallet, CheckCircle } from 'lucide-react';

import { 
  PageContainer, Section, Table, Button, Badge, FiltersBar, Pagination, EmptyState, ApiErrorDisplay, TableSkeleton, StatusChip, Tabs
} from '@/components/ui';

import { treasuryApi } from '@/api/treasury.api';
import { queryKeys } from '@/api/queryKeys';

import { CashSessionDetailDrawer } from '@/features/finance/components/CashSessionDetailDrawer';

export default function CashSessionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState('');

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.treasury.shifts({ page, pageSize, status: statusFilter }),
    queryFn: () => treasuryApi.getShifts({ page, pageSize, status: statusFilter }),
  });

  const handleView = (id: string) => {
    setSelectedShiftId(id);
    setDetailOpen(true);
  };

  const shifts = data?.data ?? [];
  const total = data?.total ?? 0;

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <PageContainer
      tabs={<Tabs items={FINANCE_TABS} />}
      
      title="Tesorería y Arqueos (Cash Shifts)" 
      subtitle="Monitor de sesiones de caja de todas las sucursales, retiros manuales y control de diferencias."
    >
      <FiltersBar actions={<Badge color="gray">{total} sesiones</Badge>}>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
          <option value="">Todos los Turnos</option>
          <option value="OPEN">Turnos Abiertos (Operando)</option>
          <option value="CLOSED">Turnos Cerrados (Arqueados)</option>
        </select>
      </FiltersBar>

      <Section>
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
                render: (s) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{s.id.split('-')[0]}</span>
              },
              { 
                key: 'account', 
                header: 'Caja Física',
                render: (s) => <span style={{ fontWeight: 500 }}>{s.accountName || 'Caja Registradora'}</span>
              },
              { 
                key: 'openTime', 
                header: 'Apertura',
                render: (s) => <span style={{ fontSize: '13px' }}>{new Date(s.openedAt).toLocaleString()}</span>
              },
              { 
                key: 'operator', 
                header: 'Operador',
                render: (s) => <span style={{ color: 'var(--text-secondary)' }}>{s.openedByUserName}</span>
              },
              { 
                key: 'diff', 
                header: 'Diferencia de Arqueo',
                render: (s) => {
                  if (s.status === 'OPEN') return <span style={{ color: 'var(--text-muted)' }}>Operando...</span>;
                  const diff = s.difference || 0;
                  if (diff === 0) return <Badge color="green"><CheckCircle size={12} /> Exacto</Badge>;
                  return <Badge color={diff < 0 ? 'red' : 'warning'}>{diff < 0 ? 'Faltante' : 'Sobrante'} {fmtCurrency(diff)}</Badge>;
                }
              },
              { 
                key: 'status', 
                header: 'Estado',
                render: (s) => <StatusChip label={s.status} color={s.status === 'OPEN' ? 'green' : 'gray'} />
              },
              {
                key: 'actions',
                header: '',
                render: (s) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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

    </PageContainer>
  );
}
