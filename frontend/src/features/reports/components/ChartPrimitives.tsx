import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import styles from './ChartPrimitives.module.css';

function useCssVars<T extends HTMLElement>(vars: Record<string, string | number | undefined>) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    Object.entries(vars).forEach(([key, value]) => {
      if (value !== undefined) el.style.setProperty(key, String(value));
    });
  }, [vars]);
  return ref;
}

// ─── Skeletons & States ───────────────────────────────────────────────────────

export function KpiCardSkeleton() {
  return (
    <div className={styles.kpiSkeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonBarSmall} />
        <div className={styles.skeletonIcon} />
      </div>
      <div className={styles.skeletonBarLarge} />
    </div>
  );
}

export function ChartSkeleton({ height = 220 }: { height?: number }) {
  return <div className={styles.chartSkeleton} style={{ height }} />;
}

export function EmptyState({
  message = 'No hay datos para el período seleccionado.',
  icon,
}: {
  message?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <p className={styles.emptyText}>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className={styles.errorState}>
      <p className={styles.errorMessage}>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={styles.retryBtn}>
          Reintentar
        </button>
      )}
    </div>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label:    string;
  value:    string;
  subtext?: string;
  icon:     React.ReactNode;
  trend?:   { value: number; label: string };
  color?:   string;
}

export function KpiCard({ label, value, subtext, icon, trend, color = 'var(--accent)' }: KpiCardProps) {
  const trendPositive = (trend?.value ?? 0) >= 0;
  const iconRef = useCssVars<HTMLDivElement>({
    '--kpi-icon-bg': `${color}18`,
    '--kpi-icon-color': color,
  });

  return (
    <div className={clsx('glass-panel', styles.kpiCard)}>
      <div className={styles.kpiHeader}>
        <p className={styles.kpiLabel}>{label}</p>
        <div ref={iconRef} className={styles.kpiIcon}>{icon}</div>
      </div>

      <div>
        <h2 className={styles.kpiValue}>{value}</h2>
        {subtext && <p className={styles.kpiSubtext}>{subtext}</p>}
      </div>

      {trend && (
        <div className={styles.kpiTrend}>
          <span className={trendPositive ? styles.trendUp : styles.trendDown}>
            {trendPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className={styles.trendLabel}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}

// ─── Recharts Responsive Wrapper & Resize Hook ────────────────────────────────

function useContainerResize() {
  const [resizeKey, setResizeKey] = useState(0);

  useEffect(() => {
    const handleResize = () => setResizeKey(k => k + 1);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return resizeKey;
}

// ─── Modern ResponsiveBarChart (Recharts) ─────────────────────────────────────

interface ResponsiveBarChartProps {
  data: { label: string; value: number; color?: string; sublabel?: string }[];
  height?: number;
  formatValue?: (v: number) => string;
  color?: string;
}

export function ResponsiveBarChart({
  data,
  height = 220,
  formatValue = (v) => String(v),
  color = '#3b82f6',
}: ResponsiveBarChartProps) {
  const resizeKey = useContainerResize();

  if (!data || data.length === 0) {
    return <EmptyState message="Sin datos para graficar." />;
  }

  return (
    <div className={styles.responsiveChartWrapper} style={{ height }}>
      <ResponsiveContainer key={resizeKey} width="100%" height="100%" minWidth={0}>
        <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
          <XAxis
            dataKey="label"
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            interval={0}
            tick={{ fill: 'var(--text-secondary)' }}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
            tick={{ fill: 'var(--text-secondary)' }}
          />
          <RechartsTooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className={styles.tooltipCard}>
                    <p className={styles.tooltipLabel}>{item.label}{item.sublabel ? ` (${item.sublabel})` : ''}</p>
                    <p className={styles.tooltipValue}>{formatValue(item.value)}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || color} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Modern ResponsiveAreaChart (Recharts) ────────────────────────────────────

interface ResponsiveAreaChartProps {
  data: { date: string; value: number; secondaryValue?: number }[];
  height?: number;
  formatValue?: (v: number) => string;
  label?: string;
  secondaryLabel?: string;
  color?: string;
  secondaryColor?: string;
}

export function ResponsiveAreaChart({
  data,
  height = 220,
  formatValue = (v) => String(v),
  label = 'Ingresos',
  secondaryLabel = 'Egresos',
  color = '#22c55e',
  secondaryColor = '#ef4444',
}: ResponsiveAreaChartProps) {
  const resizeKey = useContainerResize();

  if (!data || data.length === 0) {
    return <EmptyState message="Sin datos para graficar." />;
  }

  const hasSecondary = data.some(d => d.secondaryValue !== undefined);

  return (
    <div className={styles.responsiveChartWrapper} style={{ height }}>
      <ResponsiveContainer key={resizeKey} width="100%" height="100%" minWidth={0}>
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
          <defs>
            <linearGradient id="areaGradientPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
            {hasSecondary && (
              <linearGradient id="areaGradientSecondary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.0} />
              </linearGradient>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
          <XAxis
            dataKey="date"
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fill: 'var(--text-secondary)' }}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
            tick={{ fill: 'var(--text-secondary)' }}
          />
          <RechartsTooltip
            content={({ active, payload, label: xLabel }) => {
              if (active && payload && payload.length) {
                return (
                  <div className={styles.tooltipCard}>
                    <p className={styles.tooltipLabel}>{xLabel}</p>
                    {payload.map((p, idx) => (
                      <p key={idx} className={styles.tooltipValue} style={{ color: p.color }}>
                        {p.name}: {formatValue(Number(p.value))}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={label}
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#areaGradientPrimary)"
          />
          {hasSecondary && (
            <Area
              type="monotone"
              dataKey="secondaryValue"
              name={secondaryLabel}
              stroke={secondaryColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#areaGradientSecondary)"
            />
          )}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Fallback Legacy Primitives (for backwards compatibility) ─────────────────

function DynBar({ pct, color }: { pct: number; color?: string }) {
  const ref = useCssVars<HTMLDivElement>({
    '--bar-pct': `${pct}%`,
    '--bar-color': color ?? 'var(--accent)',
  });
  return <div ref={ref} className={styles.barFill} />;
}

function DynSegment({ pct, color, title }: { pct: number; color: string; title: string }) {
  const ref = useCssVars<HTMLDivElement>({
    '--seg-pct': `${pct}%`,
    '--seg-color': color,
  });
  return <div ref={ref} className={styles.stackedSegment} title={title} />;
}

function DynSwatch({ color }: { color: string }) {
  const ref = useCssVars<HTMLDivElement>({ '--seg-color': color });
  return <div ref={ref} className={styles.legendSwatch} />;
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  formatValue?: (v: number) => string;
  ariaLabel?: string;
}

export function BarChart({
  data,
  height = 200,
  formatValue = (v) => String(v),
  ariaLabel = 'Gráfico de barras',
}: BarChartProps) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const areaRef = useCssVars<HTMLDivElement>({ height: `${height}px` });

  return (
    <div role="img" aria-label={ariaLabel} className={styles.chartFull}>
      <div ref={areaRef} className={styles.barChartArea}>
        {data.map((d, i) => {
          const pct = (d.value / maxVal) * 100;
          return (
            <div key={i} className={styles.barColumn}>
              <span className={styles.barValue}>{formatValue(d.value)}</span>
              <DynBar pct={pct} color={d.color} />
            </div>
          );
        })}
      </div>
      <div className={styles.barLabels}>
        {data.map((d, i) => (
          <div key={i} className={styles.barLabel}>{d.label}</div>
        ))}
      </div>
    </div>
  );
}

interface StackedBarProps {
  segments: { label: string; value: number; color: string }[];
  total: number;
  formatValue?: (v: number) => string;
}

export function StackedBar({ segments, total, formatValue = (v) => String(v) }: StackedBarProps) {
  return (
    <div>
      <div className={styles.stackedTrack}>
        {segments.map((s, i) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return pct > 0 ? (
            <DynSegment
              key={i}
              pct={pct}
              color={s.color}
              title={`${s.label}: ${formatValue(s.value)} (${pct.toFixed(1)}%)`}
            />
          ) : null;
        })}
      </div>
      <div className={styles.stackedLegend}>
        {segments.map((s, i) => (
          <div key={i} className={styles.legendItem}>
            <DynSwatch color={s.color} />
            <span className={styles.legendLabel}>{s.label}:</span>
            <span className={styles.legendValue}>{formatValue(s.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
