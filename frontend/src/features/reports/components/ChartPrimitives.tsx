/**
 * Lightweight bar-chart built with pure CSS – no external charting lib needed.
 * Works for simple horizontal bar charts for report summaries.
 */
interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  max?: number;
  height?: number;
  formatValue?: (v: number) => string;
}

export function BarChart({ data, height = 200, formatValue = (v) => String(v) }: BarChartProps) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ width: '100%' }}>
      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: `${height}px`, padding: '0 4px 0' }}>
        {data.map((d, i) => {
          const pct = (d.value / maxVal) * 100;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>{formatValue(d.value)}</span>
              <div
                style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  background: d.color ?? 'var(--accent)',
                  height: `${pct}%`,
                  minHeight: '4px',
                  transition: 'height 0.5s ease',
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
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Stacked horizontal bar for distribution (e.g. payment methods).
 */
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

/**
 * KPI stat card.
 */
interface KpiCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: string;
}

export function KpiCard({ label, value, subtext, icon, trend, color = 'var(--accent)' }: KpiCardProps) {
  return (
    <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'var(--transition)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</p>
        <div style={{ padding: '8px', background: `${color}18`, borderRadius: '8px', color }}>{icon}</div>
      </div>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px' }}>{value}</h2>
        {subtext && <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{subtext}</p>}
      </div>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <span style={{ fontWeight: 700, color: trend.value >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span style={{ color: 'var(--text-muted)' }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
