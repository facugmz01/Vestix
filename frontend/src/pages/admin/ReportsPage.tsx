import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  TrendingUp, ShoppingBag, Package, Wallet,
  BarChart2, AlertCircle, DollarSign,
} from 'lucide-react';

import { PageContainer, Section } from '@/components/ui';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  KpiCard,
  KpiCardSkeleton,
  EmptyState,
  ErrorState,
  ResponsiveBarChart,
} from '@/features/reports/components/ChartPrimitives';
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar';
import { SalesReportPanel }     from '@/features/reports/components/SalesReportPanel';
import { StockReportPanel }     from '@/features/reports/components/StockReportPanel';
import { PurchasesReportPanel } from '@/features/reports/components/PurchasesReportPanel';
import { CashReportPanel }      from '@/features/reports/components/CashReportPanel';
import { useDashboard }         from '@/features/reports/hooks/useDashboard';
import { useDashboardFilters }  from '@/features/reports/hooks/useDashboardFilters';
import adminStyles from '@/styles/AdminListShared.module.css';
import styles from './ReportsPage.module.css';

type ReportTab = 'overview' | 'sales' | 'stock' | 'purchases' | 'cash';

const TABS: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',  label: 'Dashboard', icon: <BarChart2   size={14} /> },
  { id: 'sales',     label: 'Ventas',    icon: <TrendingUp  size={14} /> },
  { id: 'stock',     label: 'Stock',     icon: <Package     size={14} /> },
  { id: 'purchases', label: 'Compras',   icon: <ShoppingBag size={14} /> },
  { id: 'cash',      label: 'Caja',      icon: <Wallet      size={14} /> },
];

function TabNav({ activeTab, onChange }: { activeTab: ReportTab; onChange: (t: ReportTab) => void }) {
  return (
    <div className={clsx('glass-panel', styles.tabNav)}>
      {TABS.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={clsx(styles.tabBtn, activeTab === t.id && styles.tabBtnActive)}
        >
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

function OverviewTab({ branchId }: { branchId?: string }) {
  const { dashboard, isLoading, isError, refetch } = useDashboard(branchId, true);

  if (isLoading) {
    return (
      <div className={styles.kpiSkeletonGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message="No se pudieron cargar los datos del dashboard."
        onRetry={refetch}
      />
    );
  }

  if (!dashboard) {
    return <EmptyState message="No hay datos disponibles para el período." icon={<AlertCircle size={32} />} />;
  }

  return (
    <>
      <div className={adminStyles.statCardGrid4}>
        <KpiCard
          label="Ventas Hoy"
          value={formatCurrency(dashboard.today?.revenue ?? 0)}
          icon={<DollarSign size={20} />}
          color="#22c55e"
          trend={{ value: 0, label: `${dashboard.today?.orders ?? 0} pedidos` }}
        />
        <KpiCard
          label="Compras Hoy"
          value={formatCurrency(dashboard.today?.purchasesTotal ?? 0)}
          icon={<ShoppingBag size={20} />}
          color="#0ea5e9"
          trend={{ value: 0, label: `Pagos ${formatCurrency(dashboard.today?.supplierPayments ?? 0)}` }}
        />
        <KpiCard
          label="Deuda Proveedores"
          value={formatCurrency(dashboard.supplierPayableBalance ?? 0)}
          icon={<ShoppingBag size={20} />}
          color={(dashboard.supplierPayableBalance ?? 0) > 0 ? '#ef4444' : '#22c55e'}
          trend={{ value: 0, label: `Mes ${formatCurrency(dashboard.thisMonth?.purchasesDebt ?? 0)}` }}
        />
        <KpiCard
          label="Saldo Cajas (Efectivo)"
          value={formatCurrency(dashboard.today?.cashInDrawers ?? 0)}
          icon={<Wallet size={20} />}
          color="#8b5cf6"
        />
      </div>

      <div className={adminStyles.statCardGrid4} style={{ marginTop: 16 }}>
        <KpiCard
          label="Ventas del Mes"
          value={formatCurrency(dashboard.thisMonth?.revenue ?? 0)}
          icon={<TrendingUp size={20} />}
          color="#3b82f6"
          trend={{ value: 0, label: `${dashboard.thisMonth?.orders ?? 0} pedidos` }}
        />
        <KpiCard
          label="Compras del Mes"
          value={formatCurrency(dashboard.thisMonth?.purchasesTotal ?? 0)}
          icon={<ShoppingBag size={20} />}
          color="#0284c7"
          trend={{ value: 0, label: `Pagado ${formatCurrency(dashboard.thisMonth?.purchasesPaid ?? 0)}` }}
        />
        <KpiCard
          label="Egresos Tesorería (Mes)"
          value={formatCurrency(dashboard.thisMonth?.cashExpenses ?? 0)}
          icon={<Wallet size={20} />}
          color="#f59e0b"
          trend={{ value: 0, label: `Neto ${formatCurrency(dashboard.thisMonth?.netCash ?? 0)}` }}
        />
        <KpiCard
          label="Artículos Stock Bajo"
          value={String(dashboard.lowStockAlerts?.length ?? 0)}
          icon={<Package size={20} />}
          color={(dashboard.lowStockAlerts?.length ?? 0) > 5 ? '#ef4444' : '#f59e0b'}
        />
      </div>

      {dashboard.topSellers && dashboard.topSellers.length > 0 && (
        <div className="glass-panel" style={{ marginTop: 24, padding: 20, borderRadius: 'var(--radius-lg)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>
            Top 5 Productos del Mes
          </h4>
          <ResponsiveBarChart
            data={dashboard.topSellers.map(t => ({
              label: t.name.length > 18 ? t.name.slice(0, 16) + '…' : t.name,
              sublabel: `${t.category || 'General'} | SKU: ${t.sku}`,
              value: t.totalUnitsSold,
              color: '#3b82f6',
            }))}
            height={190}
            formatValue={(v) => `${v} un.`}
          />
        </div>
      )}

      {(dashboard.pendingOrders ?? 0) > 0 && (
        <div className={styles.pendingCard} style={{ marginTop: 16 }}>
          <h4 className={styles.pendingTitle}>Pedidos Pendientes de Despacho</h4>
          <p className={styles.pendingValue}>
            {dashboard.pendingOrders} pedidos pendientes de entrega
          </p>
        </div>
      )}
    </>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const filters = useDashboardFilters();
  const { branchId, from, to } = filters;

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['reports'] });
    setTimeout(() => setIsRefreshing(false), 400);
  };

  return (
    <PageContainer
      title="Reportes y Dashboards"
      subtitle="Análisis operativo y financiero con agregaciones en tiempo real (Hora Argentina UTC-3)."
    >
      {/* Barra de Filtros Globales Sticky con Sucursal y Presets de Fecha */}
      <ReportFilterBar
        filters={filters}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview'  && <Section><OverviewTab branchId={branchId || undefined} /></Section>}
      {activeTab === 'sales'     && <Section><SalesReportPanel from={from} to={to} branchId={branchId || undefined} /></Section>}
      {activeTab === 'stock'     && <Section><StockReportPanel branchId={branchId || undefined} /></Section>}
      {activeTab === 'purchases' && <Section><PurchasesReportPanel from={from} to={to} branchId={branchId || undefined} /></Section>}
      {activeTab === 'cash'      && <Section><CashReportPanel from={from} to={to} branchId={branchId || undefined} /></Section>}
    </PageContainer>
  );
}
