import clsx from 'clsx';
import styles from './Badge.module.css';

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray';

interface Props {
  color?: Color;
  children: React.ReactNode;
  dot?: boolean;
}

export function Badge({ color = 'gray', dot, children }: Props) {
  return (
    <span className={clsx(styles.badge, styles[color])}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  );
}
