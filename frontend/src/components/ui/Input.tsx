import styles from './Input.module.css';
import clsx from 'clsx';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, helperText, leftIcon, className, id, ...rest }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label} htmlFor={inputId}>{label}</label>}
      <div className={styles.inputRow}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          id={inputId}
          className={clsx(styles.input, leftIcon && styles.withIcon, error && styles.hasError, className)}
          {...rest}
        />
      </div>
      {error ? (
        <span className={styles.error}>{error}</span>
      ) : helperText ? (
        <span className={styles.helperText} style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>{helperText}</span>
      ) : null}
    </div>
  );
}
