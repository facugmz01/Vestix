import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FINANCE_TABS } from '@/navigation/moduleTabs';
import {
  PageContainer,
  Section,
  Table,
  Button,
  Badge,
  FiltersBar,
  SearchInput,
  Pagination,
  EmptyState,
  ApiErrorDisplay,
  TableSkeleton,
  Tabs,
} from '@/components/ui';
import { financeApi } from '@/api/finance.api';
import { branchesApi } from '@/api/branches.api';
import { useListPage } from '@/hooks/useListPage';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatEntityId, formatShortId } from '@/utils/formatId';
import { ActionGuard } from '@/rbac/ActionGuard';
import {
  Plus,
  Receipt,
  Layers,
  Wallet,
  Building2,
  Calendar,
  Eye,
  TrendingDown,
  PieChart,
  DollarSign,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { NewExpenseModal } from '@/features/finance/components/NewExpenseModal';
import { ExpenseCategoriesModal } from '@/features/finance/components/ExpenseCategoriesModal';
import { ExpenseDetailDrawer } from '@/features/finance/components/ExpenseDetailDrawer';
import type { Expense } from '@/types';
import styles from './ExpensesPage.module.css';

export default function ExpensesPage() {
  const { page, pageSize, filters, setPage, setFilter, search, setSearch } = useListPage({
    categoryId: '',
    branchId: '',
    status: '',
    datePreset: 'THIS_MONTH',
    startDate: '',
    endDate: '',
  });

  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Calculate default dates according to preset
  const getDateRange = () => {
    if (filters.startDate || filters.endDate) {
      return { startDate: filters.startDate, endDate: filters.endDate };
    }
    const now = new Date();
    if (filters.datePreset === 'THIS_MONTH') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return { startDate: first };
    }
    if (filters.datePreset === 'LAST_MONTH') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const last = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      return { startDate: first, endDate: last };
    }
    if (filters.datePreset === 'TODAY') {
      const today = now.toISOString().split('T')[0];
      return { startDate: today, endDate: today };
    }
    return {};
  };

  const dates = getDateRange();

  const queryFilters = {
    page,
    pageSize,
    search,
    expenseCategoryId: filters.categoryId || undefined,
    branchId: filters.branchId || undefined,
    status: filters.status || undefined,
    startDate: dates.startDate,
    endDate: dates.endDate,
  };

  // Queries
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['expenses', queryFilters],
    queryFn: () => financeApi.getExpenses(queryFilters),
  });

  const { data: summary } = useQuery({
    queryKey: ['expenses', 'summary', queryFilters],
    queryFn: () => financeApi.getExpensesSummary(queryFilters),
  });

  const { data: rawCategories } = useQuery({
    queryKey: ['expenses', 'categories'],
    queryFn: () => financeApi.getExpenseCategories(),
  });
  const categories = Array.isArray(rawCategories) ? rawCategories : [];

  const { data: rawBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.getBranches(),
  });
  const branches = Array.isArray(rawBranches)
    ? rawBranches
    : Array.isArray(rawBranches?.data)
    ? rawBranches.data
    : [];

  const handleViewDetail = (expense: Expense) => {
    setSelectedExpenseId(expense.id);
    setDetailOpen(true);
  };

  const expenses = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <PageContainer
      tabs={<Tabs items={FINANCE_TABS} />}
      title="Gastos Operativos (Expenses)"
      subtitle="Registro, categorización y trazabilidad de salidas de caja chica y cuentas bancarias."
      action={
        <div className={styles.headerButtons}>
          <Button
            variant="secondary"
            icon={<Layers size={16} />}
            onClick={() => setCategoriesOpen(true)}
          >
            Categorías
          </Button>
          <ActionGuard action="create" subject="Finance">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setNewExpenseOpen(true)}
            >
              Nuevo Gasto
            </Button>
          </ActionGuard>
        </div>
      }
    >
      {/* ── 1. CARDS DE RESUMEN ANALÍTICO ─────────────────────────────────── */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Total Gastos del Período</span>
            <div className={styles.metricIconBoxRed}>
              <TrendingDown size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>
            {formatCurrency(summary?.totalAmount ?? 0)}
          </div>
          <div className={styles.metricHint}>
            {summary?.count ?? 0} comprobantes registrados
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Categoría Principal</span>
            <div className={styles.metricIconBoxIndigo}>
              <PieChart size={18} />
            </div>
          </div>
          <div className={styles.metricValueSm}>
            {summary?.topCategory?.name || 'Sin gastos'}
          </div>
          <div className={styles.metricHint}>
            {summary?.topCategory
              ? `${formatCurrency(summary.topCategory.total)} (${summary.topCategory.percentage.toFixed(1)}% del total)`
              : '0% del total'}
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricTitle}>Distribución por Canal</span>
            <div className={styles.metricIconBoxSky}>
              <Wallet size={18} />
            </div>
          </div>
          <div className={styles.channelRow}>
            <span className={styles.channelLabel}>
              <Wallet size={13} className={styles.cashDot} /> Caja Chica:
            </span>
            <strong className={styles.channelValue}>
              {formatCurrency(summary?.byOrigin?.cashTotal ?? 0)}
            </strong>
          </div>
          <div className={styles.channelRow}>
            <span className={styles.channelLabel}>
              <Building2 size={13} className={styles.bankDot} /> Cuentas/Bancos:
            </span>
            <strong className={styles.channelValue}>
              {formatCurrency(summary?.byOrigin?.bankTotal ?? 0)}
            </strong>
          </div>
        </div>
      </div>

      {/* ── 2. BARRA DE FILTROS ────────────────────────────────────────────── */}
      <FiltersBar
        search={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por concepto, comprobante o notas..."
          />
        }
        filters={
          <div className={styles.filtersWrapper}>
            <select
              className={styles.filterSelect}
              value={filters.datePreset}
              onChange={(e) => {
                setFilter('datePreset', e.target.value);
                setFilter('startDate', '');
                setFilter('endDate', '');
                setPage(1);
              }}
            >
              <option value="THIS_MONTH">Este Mes</option>
              <option value="LAST_MONTH">Mes Anterior</option>
              <option value="TODAY">Hoy</option>
              <option value="ALL">Todo el Historial</option>
            </select>

            <select
              className={styles.filterSelect}
              value={filters.categoryId}
              onChange={(e) => {
                setFilter('categoryId', e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filters.branchId}
              onChange={(e) => {
                setFilter('branchId', e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas las Sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={filters.status}
              onChange={(e) => {
                setFilter('status', e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los Estados</option>
              <option value="PAID">Pagados</option>
              <option value="CANCELLED">Anulados</option>
            </select>
          </div>
        }
      />

      {/* ── 3. TABLA DE GASTOS ────────────────────────────────────────────── */}
      <Section>
        {error ? (
          <ApiErrorDisplay error={error} onRetry={() => refetch()} />
        ) : isLoading ? (
          <TableSkeleton rows={6} />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={<Receipt size={40} />}
            title="No se encontraron gastos"
            message="No hay registros de gastos operativos con los filtros seleccionados."
            action={
              <ActionGuard action="create" subject="Finance">
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setNewExpenseOpen(true)}
                >
                  Registrar Primer Gasto
                </Button>
              </ActionGuard>
            }
          />
        ) : (
          <>
            <Table
              keyField="id"
              data={expenses}
              columns={[
                {
                  key: 'date',
                  header: 'Fecha',
                  render: (e: Expense) => (
                    <span className={styles.tableDate}>
                      {new Date(e.date).toLocaleDateString()}
                      <span className={styles.tableTime}>
                        {new Date(e.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                  ),
                },
                {
                  key: 'category',
                  header: 'Categoría',
                  render: (e: Expense) => (
                    <span className={styles.categoryTag}>
                      {e.expenseCategory?.name || 'General'}
                    </span>
                  ),
                },
                {
                  key: 'description',
                  header: 'Concepto / Comprobante',
                  render: (e: Expense) => (
                    <div className={styles.descCell}>
                      <span className={styles.descText}>{e.description}</span>
                      {e.receiptNumber && (
                        <span className={styles.receiptSmallTag}>
                          Ref: {e.receiptNumber}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'origin',
                  header: 'Origen de Fondos',
                  render: (e: Expense) =>
                    e.cashShift ? (
                      <div className={styles.originCell}>
                        <Wallet size={14} className={styles.cashIcon} />
                        <span>
                          {e.cashShift.cashRegister?.name || 'Caja física'}
                        </span>
                      </div>
                    ) : e.financialAccount ? (
                      <div className={styles.originCell}>
                        <Building2 size={14} className={styles.bankIcon} />
                        <span>{e.financialAccount.name}</span>
                      </div>
                    ) : (
                      <span>—</span>
                    ),
                },
                {
                  key: 'branch',
                  header: 'Sucursal',
                  render: (e: Expense) => (
                    <span>{e.branch?.name || '—'}</span>
                  ),
                },
                {
                  key: 'amount',
                  header: 'Monto',
                  render: (e: Expense) => (
                    <span
                      className={
                        e.status === 'CANCELLED'
                          ? styles.amountCancelled
                          : styles.amountText
                      }
                    >
                      -{formatCurrency(e.amount)}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Estado',
                  render: (e: Expense) => (
                    <Badge color={e.status === 'CANCELLED' ? 'red' : 'green'}>
                      {e.status === 'CANCELLED' ? 'ANULADO' : 'PAGADO'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: '',
                  render: (e: Expense) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye size={15} />}
                      onClick={() => handleViewDetail(e)}
                      title="Ver detalle del gasto"
                    />
                  ),
                },
              ]}
            />

            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </Section>

      {/* ── 4. MODALES Y DRAWERS ───────────────────────────────────────────── */}
      {newExpenseOpen && (
        <NewExpenseModal
          open={newExpenseOpen}
          onClose={() => setNewExpenseOpen(false)}
          onOpenCategories={() => {
            setNewExpenseOpen(false);
            setCategoriesOpen(true);
          }}
        />
      )}

      {categoriesOpen && (
        <ExpenseCategoriesModal
          open={categoriesOpen}
          onClose={() => setCategoriesOpen(false)}
        />
      )}

      {detailOpen && selectedExpenseId && (
        <ExpenseDetailDrawer
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setSelectedExpenseId(null);
          }}
          expenseId={selectedExpenseId}
        />
      )}
    </PageContainer>
  );
}
