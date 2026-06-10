import styles from './PageContainer.module.css';

interface Props {
  title:     string;
  subtitle?: string;
  action?:   React.ReactNode;
  tabs?:     React.ReactNode;
  children:  React.ReactNode;
}

/**
 * Top-level wrapper for every admin page.
 * Provides consistent page header and content spacing.
 */
export function PageContainer({ title, subtitle, action, tabs, children }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>
      {tabs && <div className={styles.tabsWrapper}>{tabs}</div>}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
