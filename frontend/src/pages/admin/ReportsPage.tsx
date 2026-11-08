import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  TrendingUp, ShoppingBag, Package, Wallet,
  BarChart2, AlertCircle, ArrowUpRight,
} from 'lucide-react';

import { PageContainer, Section } from '@/components/ui';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  KpiCardSkeleton,
  EmptyState,
  ErrorState,
} from '@/features/reports/components/ChartPrimitives';
import { ReportFilterBar } from '@/features/reports/components/ReportFilterBar';
import { SalesReportPanel }     from '@/features/reports/components/SalesReportPanel';
import { StockReportPanel }     from '@/features/reports/components/StockReportPanel';
import { PurchasesReportPanel } from '@/features/reports/components/PurchasesReportPanel';
import { CashReportPanel }      from '@/features/reports/components/CashReportPanel';
import { useDashboard }         from '@/features/reports/hooks/useDashboard';
import { useDashboardFilters }  from '@/features/reports/hooks/useDashboardFilters';
import { OnboardingQuickStart } from '@/components/dashboard/OnboardingQuickStart';
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
    <nav className={styles.tabNav} aria-label="Reportes">
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
    </nav>
  );
}

function OverviewTab({ branchId, onTabChange }: { branchId?: string; onTabChange: (tab: ReportTab) => void }) {
  const navigate = useNavigate();
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

  const money = (value?: number) => value == null ? '—' : formatCurrency(value);
  const sellers = [...(dashboard.topSellers ?? [])].sort((a, b) => b.totalUnitsSold - a.totalUnitsSold).slice(0, 5);
  const maxUnits = Math.max(1, ...sellers.map(item => item.totalUnitsSold));
  const alerts = dashboard.lowStockAlerts ?? [];
  const updatedAt = new Date(dashboard.generatedAt);

  return (
    <div className={styles.overview}>
      <div className={styles.overviewHeading}><h2>La operación de hoy</h2>{!Number.isNaN(updatedAt.getTime()) && <span>Actualizado {updatedAt.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}</div>
      <div className={styles.metricsWrap}>
        <div className={clsx(styles.metricBlock, styles.leadMetric)}><span>Ventas de hoy</span><strong>{money(dashboard.today?.revenue)}</strong><small>{dashboard.today?.orders ?? '—'} pedidos · pesos argentinos</small></div>
        <div className={styles.metricBlock}><span>Efectivo en cajas</span><strong>{money(dashboard.today?.cashInDrawers)}</strong><small>Saldo disponible hoy</small></div>
        <div className={styles.metricBlock}><span>Compras de hoy</span><strong>{money(dashboard.today?.purchasesTotal)}</strong><small>Pagos a proveedores: {money(dashboard.today?.supplierPayments)}</small></div>
      </div>
      <div className={styles.dashboardGrid}>
        <section className={styles.panel} aria-labelledby="sellers-heading"><div className={styles.panelHeading}><div><h2 id="sellers-heading">Lo más vendido</h2><p>Este mes · unidades por variante</p></div><button className={styles.textAction} onClick={() => onTabChange('sales')}>Ver ventas <ArrowUpRight size={15} /></button></div>
          {sellers.length ? <ol className={styles.sellerList}>{sellers.map(item => <li key={item.variantId}><div className={styles.sellerRow}><div><span>{item.name}</span><small>{item.sku}</small></div><strong>{item.totalUnitsSold.toLocaleString('es-AR')} <small>un.</small></strong></div><div className={styles.barTrack}><div style={{ width: (item.totalUnitsSold / maxUnits * 100) + '%' }} /></div></li>)}</ol> : <p className={styles.emptyMessage}>Todavía no hay productos vendidos este mes. Las ventas aparecerán acá cuando se registren.</p>}
        </section>
        <section className={styles.panel} aria-labelledby="pending-heading"><div className={styles.panelHeading}><div><h2 id="pending-heading">Para resolver</h2><p>Despachos, reposición y proveedores</p></div></div>
          <button className={styles.taskRow} onClick={() => navigate('/admin/delivery')}><div><span>Pedidos por despachar</span><small>{dashboard.pendingOrders ? 'Continuar con la preparación' : 'Sin despachos pendientes'}</small></div><strong>{dashboard.pendingOrders ?? '—'}</strong><ArrowUpRight size={16} /></button>
          <button className={styles.taskRow} onClick={() => onTabChange('stock')}><div><span>Variantes con stock bajo</span><small>{alerts.length ? 'Revisar talles y colores' : 'Sin alertas de reposición'}</small></div><strong className={alerts.length ? styles.warning : undefined}>{alerts.length}</strong><ArrowUpRight size={16} /></button>
          <div className={styles.payable}><span>Deuda con proveedores</span><strong>{money(dashboard.supplierPayableBalance)}</strong><small>Deuda de compras del mes: {money(dashboard.thisMonth?.purchasesDebt)}</small></div>
        </section>
      </div>
      <section className={styles.monthPanel} aria-labelledby="month-heading"><div className={styles.panelHeading}><h2 id="month-heading">El mes en números</h2><span>Mes actual · ARS</span></div><div className={styles.monthMetrics}><div className={styles.metricBlock}><span>Ventas del mes</span><strong>{money(dashboard.thisMonth?.revenue)}</strong><small>{dashboard.thisMonth?.orders ?? '—'} pedidos</small></div><div className={styles.metricBlock}><span>Compras del mes</span><strong>{money(dashboard.thisMonth?.purchasesTotal)}</strong><small>Pagado: {money(dashboard.thisMonth?.purchasesPaid)}</small></div><div className={styles.metricBlock}><span>Egresos de tesorería</span><strong>{money(dashboard.thisMonth?.cashExpenses)}</strong><small>Neto: {money(dashboard.thisMonth?.netCash)}</small></div></div></section>
    </div>
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
      title="Dashboard"
      className={styles.page}
      subtitle="Ventas, stock y caja de tu negocio. Hora Argentina."
    >

      <TabNav activeTab={activeTab} onChange={setActiveTab} />
      <ReportFilterBar
        filters={filters}
        showDates={activeTab !== 'overview' && activeTab !== 'stock'}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {activeTab === 'overview'  && <Section><OverviewTab branchId={branchId || undefined} onTabChange={setActiveTab} /></Section>}
      {activeTab === 'sales'     && <Section><SalesReportPanel from={from} to={to} branchId={branchId || undefined} /></Section>}
      {activeTab === 'stock'     && <Section><StockReportPanel branchId={branchId || undefined} /></Section>}
      {activeTab === 'purchases' && <Section><PurchasesReportPanel from={from} to={to} branchId={branchId || undefined} /></Section>}
      {activeTab === 'cash'      && <Section><CashReportPanel from={from} to={to} branchId={branchId || undefined} /></Section>}
      <OnboardingQuickStart />
    </PageContainer>
  );
}
