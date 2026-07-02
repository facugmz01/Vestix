import React from 'react';

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

  return (
    <div role="img" aria-label={ariaLabel} style={{ width: '100%' }}>
      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: `${height}px`, padding: '0 4px 0' }}>
        {data.map((d, i) => {
          const pct = (d.value / maxVal) * 100;
          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                {formatValue(d.value)}
              </span>
              <div
                style={{
                  width: '100%',
                  borderRadius: '4px 4px 0 0',
                  background: d.color ?? 'var(--accent)',
                  height: `${pct}%`,
                  minHeight: '4px',
                  transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: 0.85,
                }}
              />
            </div>
          );
        })}
      </div>
      {/* X labels */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 4px', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {d.label}
          </div>
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
      <div style={{ display: 'flex', height: '32px', borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
        {segments.map((s, i) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return pct > 0 ? (
            <div
              key={i}
              title={`${s.label}: ${formatValue(s.value)} (${pct.toFixed(1)}%)`}
              style={{ background: s.color, width: `${pct}%`, transition: 'width 0.4s ease' }}
            />
          ) : null;
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text-secondary)' }}>{s.label}:</span>
            <span style={{ fontWeight: 700 }}>{formatValue(s.value)}</span>
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

  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'var(--transition)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </p>
        <div style={{ padding: '8px', background: `${color}18`, borderRadius: '8px', color }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div>
        <h2
          style={{
            margin: '0 0 4px',
            fontSize: '28px',
            fontWeight: 900,
            letterSpacing: '-0.5px',
            animation: 'kpiCountIn 0.4s ease',
          }}
        >
          {value}
        </h2>
        {subtext && (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{subtext}</p>
        )}
      </div>

      {/* Trend */}
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ fontWeight: 700, color: trendPositive ? 'var(--green)' : 'var(--red)' }}>
            {trendPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{trend.label}</span>
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

/** Reusable empty/no-data state for panels */
export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
      {icon && <div style={{ marginBottom: '12px', opacity: 0.4 }}>{icon}</div>}
      <p style={{ margin: 0, fontSize: '14px' }}>{message}</p>
    </div>
  );
}

// ─── ErrorState ───────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/** Reusable error state for panels */
export function ErrorState({ message = 'Ocurrió un error al cargar los datos.', onRetry }: ErrorStateProps) {
  return (
    <div
      style={{
        padding: '32px 24px',
        textAlign: 'center',
        border: '1px solid var(--red)',
        borderRadius: '12px',
        background: 'color-mix(in srgb, var(--red) 8%, transparent)',
      }}
    >
      <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--red)', fontWeight: 600 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '6px 16px',
            borderRadius: '6px',
            border: '1px solid var(--red)',
            background: 'transparent',
            color: 'var(--red)',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
