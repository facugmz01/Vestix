import styles from './EmptyState.module.css';
import type { ReactNode } from 'react';

interface Props {
  icon?:     ReactNode;
  title:     string;
  message?:  string;
  action?:   ReactNode;
}

/** Shown when a list/table has no results. */
export function EmptyState({ icon, title, message, action }: Props) {
  return (
    <div className={styles.shell}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
      {action  && <div className={styles.action}>{action}</div>}
    </div>
  );
}
