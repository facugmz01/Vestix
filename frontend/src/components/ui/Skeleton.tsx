import styles from './Skeleton.module.css';
import clsx from 'clsx';

interface SkeletonProps {
  width?:  string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

/** Single shimmer block. Compose for custom layouts. */
export function Skeleton({ width = '100%', height = 16, radius = '6px', className }: SkeletonProps) {
  return (
    <span
      className={clsx(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
      aria-hidden
    />
  );
}

/** Full-width table skeleton — mimics a data table with N rows. */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className={styles.tableWrapper}>
      {/* Header */}
      <div className={styles.row} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={12} width={`${60 + (i % 3) * 20}px`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.row}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height={14} width={c === 0 ? '40%' : `${50 + (c * 15)}px`} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Grid of card skeletons for product/catalog views. */
export function CardGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <Skeleton height={160} radius="10px" />
          <Skeleton height={14} width="70%" />
          <Skeleton height={12} width="40%" />
        </div>
      ))}
    </div>
  );
}

/** Stat card row skeleton for dashboards. */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.statsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.statCard}>
          <Skeleton height={12} width="50%" />
          <Skeleton height={28} width="65%" />
          <Skeleton height={11} width="40%" />
        </div>
      ))}
    </div>
  );
}
