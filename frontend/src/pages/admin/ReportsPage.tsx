import { useState } from 'react';
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportTab = 'overview' | 'sales' | 'stock' | 'purchases' | 'cash';

const TABS: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',  label: 'Dashboard', icon: <BarChart2   size={14} /> },
  { id: 'sales',     label: 'Ventas',    icon: <TrendingUp  size={14} /> },
  { id: 'stock',     label: 'Stock',     icon: <Package     size={14} /> },
  { id: 'purchases', label: 'Compras',   icon: <ShoppingBag size={14} /> },
  { id: 'cash',      label: 'Caja',      icon: <Wallet      size={14} /> },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabNav({ activeTab, onChange }: { activeTab: ReportTab; onChange: (t: ReportTab) => void }) {
  return (
    <div
      className="glass-panel"
      style={{ display: 'flex', gap: '4px', marginBottom: '24px', padding: '6px', borderRadius: 'var(--radius-lg)', width: 'fit-content', overflowX: 'auto' }}
    >
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '8px 16px', borderRadius: '6px', border: 'none',
            background: activeTab === t.id ? 'var(--accent)' : 'transparent',
            color:      activeTab === t.id ? '#fff' : 'var(--text-secondary)',
            fontWeight: 700, cursor: 'pointer', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'background 0.2s, color 0.2s',
          }}
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
  onPreset: (p: any) => void;
}) {
  return (
    <div
      className="glass-panel"
      style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', padding: '14px 16px', borderRadius: 'var(--radius-lg)', flexWrap: 'wrap' }}
    >
      <Calendar size={16} color="var(--text-secondary)" />
      <label style={{ fontSize: '13px', fontWeight: 600 }}>Período:</label>
      <input
        type="date" value={from}
        onChange={e => setFrom(e.target.value)}
        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
      />
      <span style={{ color: 'var(--text-muted)' }}>—</span>
      <input
        type="date" value={to}
        onChange={e => setTo(e.target.value)}
        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
      />
      <div style={{ display: 'flex', gap: '6px', marginLeft: '4px' }}>
        {DATE_PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => onPreset(p.value)}
            style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-base)', fontSize: '12px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ branchId }: { branchId?: string }) {
  const { dashboard, isLoading, isError, refetch } = useDashboard(branchId, true);

  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: '140px', borderRadius: '12px', background: 'var(--bg-elevated)', animation: 'pulse 1.5s ease infinite' }} />
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard
          label="Ventas Hoy"
          value={formatCurrency(dashboard.today?.revenue ?? 0)}
          icon={<TrendingUp size={20} />}
          color="#22c55e"
          trend={{ value: 0, label: `${dashboard.today?.orders ?? 0} pedidos` }}
        />
        <KpiCard
          label="Pedidos del Mes"
          value={String(dashboard.thisMonth?.orders ?? 0)}
          icon={<ShoppingBag size={20} />}
          color="#3b82f6"
        />
        <KpiCard
          label="Artículos Stock Bajo"
          value={String(dashboard.lowStockAlerts?.length ?? 0)}
          icon={<Package size={20} />}
          color={(dashboard.lowStockAlerts?.length ?? 0) > 5 ? '#ef4444' : '#f59e0b'}
        />
        <KpiCard
          label="Saldo Cajas Abiertas"
          value={formatCurrency(dashboard.today?.cashInDrawers ?? 0)}
          icon={<Wallet size={20} />}
          color="#8b5cf6"
        />
      </div>

      {(dashboard.pendingOrders ?? 0) > 0 && (
        <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700 }}>Pedidos Pendientes</h4>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#f59e0b' }}>
            {dashboard.pendingOrders}
          </p>
        </div>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
