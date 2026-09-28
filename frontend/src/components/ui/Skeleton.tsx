import styles from './Skeleton.module.css';
import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';

export interface SkeletonProps {
  width?: string | number;
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

/** Full-width table skeleton — mimics a data table with N rows and realistic column widths. */
export function TableSkeleton({
  rows = 5,
  cols = 4,
  showHeader = true,
  className,
}: {
  rows?: number;
  cols?: number;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx(styles.tableWrapper, className)}>
      {showHeader && (
        <div className={clsx(styles.row, styles.headerRow)}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton
              key={i}
              className={styles.h12}
              width={i === 0 ? '25%' : `${60 + (i % 3) * 25}px`}
            />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.row}>
          {Array.from({ length: cols }).map((_, c) => {
            const width =
              c === 0
                ? `${40 + (r % 3) * 15}%`
                : c === cols - 1
                ? '60px'
                : `${65 + ((r + c) % 4) * 20}px`;
            return <Skeleton key={c} className={styles.h14} width={width} />;
          })}
        </div>
      ))}
    </div>
  );
}

/** Grid of card skeletons for product/catalog views. */
export function CardGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={clsx(styles.grid, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <Skeleton className={clsx(styles.h160, styles.r10)} />
          <div className={styles.cardContent}>
            <div className={styles.cardMeta}>
              <Skeleton width={50} height={18} className={styles.rFull} />
            </div>
            <Skeleton className={clsx(styles.h14, styles.w70p)} />
            <Skeleton className={clsx(styles.h12, styles.w40p)} />
            <div className={styles.cardFooter}>
              <Skeleton width="35%" height={16} />
              <Skeleton width={28} height={28} className={styles.r6} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Stat card row skeleton for dashboards and overview cards. */
export function StatsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={clsx(styles.statsRow, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.statCard}>
          <div className={styles.statHeader}>
            <Skeleton className={clsx(styles.h12, styles.w50p)} />
            <Skeleton width={32} height={32} className={styles.rFull} />
          </div>
          <Skeleton className={clsx(styles.h28, styles.w65p)} />
          <Skeleton className={clsx(styles.h11, styles.w40p)} />
        </div>
      ))}
    </div>
  );
}

/** Mimics a form with field labels, inputs, and action buttons. */
export function FormSkeleton({
  fields = 4,
  columns = 2,
  showActions = true,
  className,
}: {
  fields?: number;
  columns?: 1 | 2;
  showActions?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx(styles.formWrapper, className)}>
      <div
        className={clsx(
          styles.formGrid,
          columns === 2 ? styles.formGrid2 : styles.formGrid1
        )}
      >
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className={styles.formField}>
            <Skeleton width={`${30 + (i % 3) * 15}%`} height={13} className={styles.r4} />
            <Skeleton width="100%" height={38} className={styles.r6} />
          </div>
        ))}
      </div>
      {showActions && (
        <div className={styles.formActions}>
          <Skeleton width={80} height={36} className={styles.r6} />
          <Skeleton width={110} height={36} className={styles.r6} />
        </div>
      )}
    </div>
  );
}

/** Mimics a side drawer loading with header, badge, tabs, and details. */
export function DetailDrawerSkeleton({
  tabs = 3,
  sections = 2,
  className,
}: {
  tabs?: number;
  sections?: number;
  className?: string;
}) {
  return (
    <div className={clsx(styles.drawerSkeleton, className)}>
      {/* Drawer Hero / Summary Header */}
      <div className={styles.drawerHero}>
        <div className={styles.drawerHeroTop}>
          <Skeleton width="55%" height={22} className={styles.r6} />
          <Skeleton width={70} height={22} className={styles.rFull} />
        </div>
        <Skeleton width="35%" height={13} className={styles.r4} />
      </div>

      {/* Tabs strip */}
      {tabs > 0 && (
        <div className={styles.drawerTabs}>
          {Array.from({ length: tabs }).map((_, i) => (
            <Skeleton
              key={i}
              width={`${75 + (i % 3) * 20}px`}
              height={30}
              className={styles.r6}
            />
          ))}
        </div>
      )}

      {/* Drawer content body */}
      <div className={styles.drawerBody}>
        {/* Quick mini-stat cards */}
        <div className={styles.drawerStatsRow}>
          <div className={styles.drawerMiniCard}>
            <Skeleton width="45%" height={11} className={styles.r4} />
            <Skeleton width="75%" height={20} className={styles.r4} />
          </div>
          <div className={styles.drawerMiniCard}>
            <Skeleton width="45%" height={11} className={styles.r4} />
            <Skeleton width="75%" height={20} className={styles.r4} />
          </div>
        </div>

        {/* Content sections */}
        {Array.from({ length: sections }).map((_, s) => (
          <div key={s} className={styles.drawerSection}>
            <Skeleton width="35%" height={14} className={styles.r4} />
            <div className={styles.drawerFields}>
              <div className={styles.drawerRow}>
                <Skeleton width="35%" height={12} className={styles.r4} />
                <Skeleton width="45%" height={12} className={styles.r4} />
              </div>
              <div className={styles.drawerRow}>
                <Skeleton width="40%" height={12} className={styles.r4} />
                <Skeleton width="30%" height={12} className={styles.r4} />
              </div>
              <div className={styles.drawerRow}>
                <Skeleton width="50%" height={12} className={styles.r4} />
                <Skeleton width="25%" height={12} className={styles.r4} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
