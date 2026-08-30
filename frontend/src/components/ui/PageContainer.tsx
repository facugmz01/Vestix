import clsx from 'clsx';
import { PageHeader } from './PageHeader';
import styles from './PageContainer.module.css';

export interface PageContainerProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  tabs?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
  children: React.ReactNode;
}

/**
 * Top-level responsive page layout wrapper for all ERP views.
 * Handles spacing, header, horizontal tabs, and maximum width.
 */
export function PageContainer({
  title,
  subtitle,
  badge,
  action,
  tabs,
  maxWidth = 'full',
  className,
  children,
}: PageContainerProps) {
  return (
    <div className={clsx(styles.page, styles[`max-${maxWidth}`], className)}>
      {title && (
        <PageHeader
          title={title}
          subtitle={subtitle}
          badge={badge}
          action={action}
        />
      )}
      {tabs && <div className={styles.tabsWrapper}>{tabs}</div>}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
