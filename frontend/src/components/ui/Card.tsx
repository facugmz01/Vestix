import clsx from 'clsx';
import styles from './Card.module.css';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ title, subtitle, action, padding = 'md', className, children, ...rest }: Props) {
  return (
    <div className={clsx('glass-card', styles.card, styles[`p-${padding}`], className)} {...rest}>
      {(title || action) && (
        <div className={styles.header}>
          <div>
            {title    && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
