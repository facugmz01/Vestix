import styles from './FiltersBar.module.css';

interface Props {
  children: React.ReactNode;
  /** Right-side slot for action buttons */
  actions?: React.ReactNode;
}

/**
 * Horizontal container for filter controls (search, selects, date pickers).
 * Automatically wraps on narrow screens.
 */
export function FiltersBar({ children, actions }: Props) {
  return (
    <div className={styles.bar}>
      <div className={styles.filters}>{children}</div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
