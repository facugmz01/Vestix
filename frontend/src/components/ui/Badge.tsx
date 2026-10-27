import clsx from 'clsx';
import styles from './Badge.module.css';

type Color = 'green' | 'yellow' | 'orange' | 'warning' | 'red' | 'blue' | 'purple' | 'gray' | 'cyan';

interface Props {
  color?: Color;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ color = 'gray', dot, children, className }: Props) {
  return (
    <span className={clsx(styles.badge, styles[color], className)}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
