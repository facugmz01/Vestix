import styles from './Skeleton.module.css';
import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';

interface SkeletonProps {
  width?:  string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

function useSkelVars(vars: Record<string, string | undefined>) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    Object.entries(vars).forEach(([k, v]) => {
      if (v !== undefined) el.style.setProperty(k, v);
    });
  }, [vars]);
  return ref;
}

/** Single shimmer block. Compose for custom layouts. */
export function Skeleton({ width = '100%', height = 16, radius = '6px', className }: SkeletonProps) {
  const ref = useSkelVars({
    '--sk-w': typeof width === 'number' ? `${width}px` : width,
    '--sk-h': typeof height === 'number' ? `${height}px` : String(height),
    '--sk-radius': radius,
  });
  return (
    <span
      ref={ref}
      className={clsx(styles.skeleton, className)}
      aria-hidden
    />
  );
}

/** Full-width table skeleton — mimics a data table with N rows. */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className={styles.tableWrapper}>
      <div className={clsx(styles.row, styles.headerRow)}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={styles.h12} width={`${60 + (i % 3) * 20}px`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.row}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={styles.h14} width={c === 0 ? '40%' : `${50 + (c * 15)}px`} />
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
          <Skeleton className={clsx(styles.h160, styles.r10)} />
          <Skeleton className={clsx(styles.h14, styles.w70p)} />
          <Skeleton className={clsx(styles.h12, styles.w40p)} />
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
          <Skeleton className={clsx(styles.h12, styles.w50p)} />
          <Skeleton className={clsx(styles.h28, styles.w65p)} />
          <Skeleton className={clsx(styles.h11, styles.w40p)} />
        </div>
      ))}
    </div>
  );
}
