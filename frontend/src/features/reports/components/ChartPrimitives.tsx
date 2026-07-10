import React, { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
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

// ─── BarChart ─────────────────────────────────────────────────────────────────

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

// ─── StackedBar ───────────────────────────────────────────────────────────────

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

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      {icon && <div className={styles.emptyIcon}>{icon}</div>}
      <p className={styles.emptyText}>{message}</p>
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Ocurrió un error al cargar los datos.', onRetry }: ErrorStateProps) {
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
