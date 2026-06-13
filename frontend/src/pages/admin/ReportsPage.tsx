import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, ShoppingBag, Package, Wallet,
  BarChart2, RefreshCw, Calendar
} from 'lucide-react';

import { 
  PageContainer, Section, Button
} from '@/components/ui';
import { reportsApi } from '@/api/reports.api';
import { queryKeys } from '@/api/queryKeys';
import { KpiCard } from '@/features/reports/components/ChartPrimitives';
import { SalesReportPanel }     from '@/features/reports/components/SalesReportPanel';
import { StockReportPanel }     from '@/features/reports/components/StockReportPanel';

import { CashReportPanel }      from '@/features/reports/components/CashReportPanel';

type ReportTab = 'overview' | 'sales' | 'stock' | 'purchases' | 'cash';

function getDefaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(1); // First of current month
  return {
    from: from.toISOString().split('T')[0],
    to:   to.toISOString().split('T')[0],
  };
}

export default function ReportsPage() {
  const defaults = getDefaultRange();
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo]     = useState(defaults.to);
  const [branchId] = useState('');

  const { data: dashboard, isLoading: dl, refetch } = useQuery({
    queryKey: queryKeys.reports.dashboard(branchId || undefined),
    queryFn: () => reportsApi.getDashboard(branchId || undefined),
    enabled: activeTab === 'overview',
  });

  const fmtCurrency = (v: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);

  const TABS: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',   label: 'Dashboard',   icon: <BarChart2 size={14} /> },
    { id: 'sales',      label: 'Ventas',       icon: <TrendingUp size={14} /> },
    { id: 'stock',      label: 'Stock',        icon: <Package size={14} /> },
    { id: 'purchases',  label: 'Compras',      icon: <ShoppingBag size={14} /> },
    { id: 'cash',       label: 'Caja',         icon: <Wallet size={14} /> },
  ];

  const tabStyle = (id: ReportTab) => ({
    padding: '8px 16px', borderRadius: '6px', border: 'none',
    background: activeTab === id ? 'var(--accent)' : 'transparent',
    color: activeTab === id ? '#fff' : 'var(--text-secondary)',
    fontWeight: 700, cursor: 'pointer', fontSize: '13px',
    display: 'flex', alignItems: 'center', gap: '6px',
  });

  return (
    <PageContainer
      title="Reportes y Dashboards"
      subtitle="Análisis operativo y financiero del negocio con datos en tiempo real."
      action={
        <Button variant="ghost" size="sm" onClick={() => refetch()} icon={<RefreshCw size={14} />}>Actualizar</Button>
      }
    >
      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)', width: 'fit-content', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} style={tabStyle(t.id)} onClick={() => setActiveTab(t.id)}>{t.icon}{t.label}</button>
        ))}
      </div>

      {/* Date Range Filter (shown for all tabs except overview) */}
      {activeTab !== 'overview' && (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <Calendar size={16} color="var(--text-secondary)" />
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Período:</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }} />
          <span style={{ color: 'var(--text-muted)' }}>—</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px' }} />

          {/* Quick ranges */}
          <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
            {[
              { label: 'Hoy', days: 0 },
              { label: '7D', days: 7 },
              { label: '30D', days: 30 },
            ].map(r => {
              const setRange = () => {
                const t = new Date();
                const f = new Date();
                f.setDate(f.getDate() - r.days);
                setFrom(f.toISOString().split('T')[0]);
                setTo(t.toISOString().split('T')[0]);
              };
              return (
                <button key={r.label} onClick={setRange} style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-base)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <Section>
          {dl ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: '120px', borderRadius: '12px', background: 'var(--bg-elevated)' }} />)}
            </div>
          ) : dashboard ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <KpiCard
                  label="Ventas Hoy"
                  value={fmtCurrency(dashboard.today?.revenue ?? 0)}
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
                  label="Artículos con Stock Bajo"
                  value={String(dashboard.lowStockAlerts?.length ?? 0)}
                  icon={<Package size={20} />}
                  color={(dashboard.lowStockAlerts?.length ?? 0) > 5 ? '#ef4444' : '#f59e0b'}
                />
                <KpiCard
                  label="Saldo Cajas Abiertas"
                  value={fmtCurrency(dashboard.today?.cashInDrawers ?? 0)}
                  icon={<Wallet size={20} />}
                  color="#8b5cf6"
                />
              </div>

              {/* Pending orders summary */}
              {(dashboard.pendingOrders ?? 0) > 0 && (
                <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700 }}>Pedidos Pendientes</h4>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#f59e0b' }}>{dashboard.pendingOrders}</p>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos disponibles.</div>
          )}
        </Section>
      )}

      {/* ─── SALES TAB ────────────────────────────────────────────────────────── */}
      {activeTab === 'sales' && (
        <Section>
          <SalesReportPanel from={from} to={to} branchId={branchId || undefined} />
        </Section>
      )}

      {/* ─── STOCK TAB ────────────────────────────────────────────────────────── */}
      {activeTab === 'stock' && (
        <Section>
          <StockReportPanel branchId={branchId || undefined} />
        </Section>
      )}

      {/* ─── PURCHASES TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'purchases' && (
        <Section>
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Reporte de compras en construcción.</div>
        </Section>
      )}

      {/* ─── CASH TAB ─────────────────────────────────────────────────────────── */}
      {activeTab === 'cash' && (
        <Section>
          <CashReportPanel from={from} to={to} branchId={branchId || undefined} />
        </Section>
      )}

    </PageContainer>
  );
}
