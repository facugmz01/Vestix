import { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  children,
  className,
  disabled,
  'aria-disabled': ariaDisabled,
  'aria-busy': ariaBusy,
  ...rest
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      className={clsx(
        styles.button,
        styles[`variant-${variant}`],
        styles[`size-${size}`],
        loading && styles.loading,
        fullWidth && styles.fullWidth,
        className
      )}
      disabled={isDisabled}
      aria-disabled={isDisabled ? 'true' : ariaDisabled}
      aria-busy={loading ? 'true' : ariaBusy}
      {...rest}
    >
      {/* 1. Spinner Absoluto */}
      {loading && (
        <span className={styles.spinnerWrapper} aria-hidden="true">
          <span className={styles.spinner} />
        </span>
      )}
      
      {/* 2. Contenedor de Textos e Iconos */}
      <span className={clsx(styles.content, loading && styles.hiddenContent)}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {children}
        {iconRight && <span className={styles.icon}>{iconRight}</span>}
      </span>
    </button>
  );
});

Button.displayName = 'Button';
