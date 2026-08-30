import clsx from 'clsx';
import styles from './PageHeader.module.css';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, badge, action, className }: PageHeaderProps) {
  return (
    <header className={clsx(styles.header, className)}>
      <div className={styles.titleGroup}>
        <div className={styles.headingRow}>
          <h1 className={styles.title}>{title}</h1>
          {badge && <div className={styles.badgeWrapper}>{badge}</div>}
        </div>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.actionGroup}>{action}</div>}
    </header>
  );
}
