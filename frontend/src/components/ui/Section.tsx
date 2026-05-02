import styles from './Section.module.css';
import clsx from 'clsx';

interface Props {
  title?:    string;
  subtitle?: string;
  action?:   React.ReactNode;
  children:  React.ReactNode;
  className?: string;
  padding?:  'sm' | 'md' | 'lg';
}

/**
 * Card-style section container used inside a PageContainer.
 * Replaces raw <Card> for content blocks that need a title bar.
 */
export function Section({ title, subtitle, action, children, className, padding = 'md' }: Props) {
  return (
    <section className={clsx(styles.section, styles[`p-${padding}`], className)}>
      {(title || action) && (
        <div className={styles.header}>
          <div>
            {title    && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
