import { forwardRef } from 'react';
import clsx from 'clsx';
import styles from './ToggleSwitch.module.css';

export interface ToggleSwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hint?: string;
}

export const ToggleSwitch = forwardRef<HTMLInputElement, ToggleSwitchProps>(
  ({ label, hint, className, disabled, ...props }, ref) => {
    return (
      <label className={clsx(styles.wrapper, disabled && styles.disabled, className)}>
        <div className={styles.textContainer}>
          {label && <span className={styles.label}>{label}</span>}
          {hint && <span className={styles.hint}>{hint}</span>}
        </div>
        <div className={styles.toggleContainer}>
          <input
            type="checkbox"
            ref={ref}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div className={styles.track}>
            <div className={styles.thumb} />
          </div>
        </div>
      </label>
    );
  }
);

ToggleSwitch.displayName = 'ToggleSwitch';
