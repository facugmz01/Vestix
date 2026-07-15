import { useState } from 'react';
import clsx from 'clsx';
import {
  TrendingUp, ShoppingBag, Package, Wallet,
  BarChart2, RefreshCw, Calendar, AlertCircle,
} from 'lucide-react';

import { PageContainer, Section, Button } from '@/components/ui';
import { formatCurrency } from '@/utils/formatCurrency';
import { KpiCard, EmptyState, ErrorState } from '@/features/reports/components/ChartPrimitives';
import { SalesReportPanel }     from '@/features/reports/components/SalesReportPanel';
import { StockReportPanel }     from '@/features/reports/components/StockReportPanel';
import { PurchasesReportPanel } from '@/features/reports/components/PurchasesReportPanel';
import { CashReportPanel }      from '@/features/reports/components/CashReportPanel';
import { useDashboard }         from '@/features/reports/hooks/useDashboard';
import { useReportFilters, DATE_PRESETS } from '@/features/reports/hooks/useReportFilters';
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

function DateRangePicker({
  from, to,
  setFrom, setTo,
  onPreset,
}: {
  from: string; to: string;
  setFrom: (v: string) => void;
  setTo:   (v: string) => void;
  onPreset: (p: unknown) => void;
}) {
  return (
    <div className={clsx('glass-panel', styles.datePickerBar)}>
      <Calendar size={16} color="var(--text-secondary)" />
      <label className={styles.dateLabel}>Período:</label>
      <input
        type="date"
        value={from}
        onChange={e => setFrom(e.target.value)}
        className={styles.dateInput}
      />
      <span className={styles.dateSep}>—</span>
      <input
        type="date"
        value={to}
        onChange={e => setTo(e.target.value)}
        className={styles.dateInput}
      />
      <div className={styles.presetGroup}>
        {DATE_PRESETS.map(p => (
          <button
            key={p.value}
            type="button"
            onClick={() => onPreset(p.value)}
            className={styles.presetBtn}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OverviewTab({ branchId }: { branchId?: string }) {
  const { dashboard, isLoading, isError, refetch } = useDashboard(branchId, true);

  if (isLoading) {
    return (
      <div className={styles.kpiSkeletonGrid}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={styles.kpiSkeleton} />
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
    return <EmptyState message="No hay datos disponibles." icon={<AlertCircle size={32} />} />;
  }

  return (
    <>
      <div className={adminStyles.statCardGrid4}>
        <KpiCard
          label="Ventas Hoy"
          value={formatCurrency(dashboard.today?.revenue ?? 0)}
          icon={<TrendingUp size={20} />}
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
          label="Saldo Cajas"
          value={formatCurrency(dashboard.today?.cashInDrawers ?? 0)}
          icon={<Wallet size={20} />}
          color="#8b5cf6"
        />
      </div>

      <div className={adminStyles.statCardGrid4} style={{ marginTop: 16 }}>
        <KpiCard
          label="Pedidos del Mes"
          value={String(dashboard.thisMonth?.orders ?? 0)}
          icon={<TrendingUp size={20} />}
          color="#3b82f6"
          trend={{ value: 0, label: formatCurrency(dashboard.thisMonth?.revenue ?? 0) }}
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

      {(dashboard.pendingOrders ?? 0) > 0 && (
        <div className={styles.pendingCard}>
          <h4 className={styles.pendingTitle}>Pedidos Pendientes</h4>
          <p className={styles.pendingValue}>
            {dashboard.pendingOrders}
          </p>
        </div>
      )}
    </>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [branchId] = useState('');

  const { from, to, setFrom, setTo, applyPreset } = useReportFilters('month');
  const { refetch } = useDashboard(branchId || undefined, activeTab === 'overview');

  return (
    <PageContainer
      title="Reportes y Dashboards"
      subtitle="Análisis operativo y financiero del negocio con datos en tiempo real."
      action={
        <Button variant="ghost" size="sm" onClick={refetch} icon={<RefreshCw size={14} />}>
          Actualizar
        </Button>
      }
    >
      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      {activeTab !== 'overview' && (
        <DateRangePicker from={from} to={to} setFrom={setFrom} setTo={setTo} onPreset={applyPreset} />
      )}

      {activeTab === 'overview'  && <Section><OverviewTab branchId={branchId || undefined} /></Section>}
      {activeTab === 'sales'     && <Section><SalesReportPanel from={from} to={to} branchId={branchId || undefined} /></Section>}
      {activeTab === 'stock'     && <Section><StockReportPanel branchId={branchId || undefined} /></Section>}
      {activeTab === 'purchases' && <Section><PurchasesReportPanel from={from} to={to} branchId={branchId || undefined} /></Section>}
      {activeTab === 'cash'      && <Section><CashReportPanel from={from} to={to} branchId={branchId || undefined} /></Section>}
    </PageContainer>
  );
}
