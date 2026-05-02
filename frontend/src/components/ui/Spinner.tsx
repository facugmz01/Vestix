import styles from './Spinner.module.css';
import clsx from 'clsx';

type Size = 'sm' | 'md' | 'lg';
export function Spinner({ size = 'md', className }: { size?: Size; className?: string }) {
  return <span className={clsx(styles.spinner, styles[size], className)} />;
}

export function PageSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Spinner size="lg" />
    </div>
  );
}
