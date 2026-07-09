import styles from './PageContainer.module.css';
import { PageHeader } from './PageHeader';

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
      <PageHeader title={title} subtitle={subtitle} action={action} />
      {tabs && <div className={styles.tabsWrapper}>{tabs}</div>}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
