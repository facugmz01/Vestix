import styles from './EmptyState.module.css';
import type { ReactNode } from 'react';
import clsx from 'clsx';

export interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message?: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  badge?: ReactNode;
  variant?: 'default' | 'card' | 'compact';
  className?: string;
}

/**
 * Shown when a list/table/drawer has no results or empty data.
 * Supports primary & secondary actions, badge chip, and multiple layout variants.
 */
export function EmptyState({
  icon,
  title,
  message,
  description,
  action,
  secondaryAction,
  badge,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const desc = description ?? message;

  return (
    <div className={clsx(styles.shell, styles[variant], className)}>
      {badge && <div className={styles.badgeWrapper}>{badge}</div>}
      {icon && (
        <div className={styles.iconCircle}>
          <div className={styles.icon}>{icon}</div>
        </div>
      )}
      {title && <h3 className={styles.title}>{title}</h3>}
      {desc && <p className={styles.message}>{desc}</p>}
      {(action || secondaryAction) && (
        <div className={styles.actions}>
          {action && <div className={styles.actionPrimary}>{action}</div>}
          {secondaryAction && <div className={styles.actionSecondary}>{secondaryAction}</div>}
        </div>
      )}
    </div>
  );
}
