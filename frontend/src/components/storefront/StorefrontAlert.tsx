import clsx from 'clsx';
import styles from './storefront.module.css';

type Props = {
  variant: 'error' | 'success' | 'info';
  children: React.ReactNode;
  className?: string;
};

export function StorefrontAlert({ variant, children, className }: Props) {
  return (
    <div
      className={clsx(
        styles.alert,
        'animate-fade',
        variant === 'error' && styles.alertError,
        variant === 'success' && styles.alertSuccess,
        variant === 'info' && styles.alertInfo,
        className,
      )}
      role="alert"
    >
      {children}
    </div>
  );
}
