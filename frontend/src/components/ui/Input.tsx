import React, { forwardRef, useId } from 'react';
import clsx from 'clsx';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  containerClassName,
  id,
  disabled,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
  ...rest
}, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const isInvalid = !!error || ariaInvalid === true || ariaInvalid === 'true';

  let describedBy = ariaDescribedBy || '';
  if (error) describedBy += ` ${errorId}`;
  else if (helperText) describedBy += ` ${helperId}`;

  return (
    <div className={clsx(styles.wrapper, containerClassName)}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      
      <div className={styles.inputRow}>
        {leftIcon && (
          <span className={clsx(styles.icon, styles.leftIcon)} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            styles.input,
            {
              [styles.withLeftIcon]: !!leftIcon,
              [styles.withRightIcon]: !!rightIcon,
              [styles.hasError]: isInvalid,
            },
            className
          )}
          disabled={disabled}
          aria-invalid={isInvalid}
          aria-describedby={describedBy.trim() || undefined}
          {...rest}
        />
        
        {rightIcon && (
          <span className={clsx(styles.icon, styles.rightIcon)} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </div>
      
      {/* Accesibility: aria-live polite will read the error without stopping the user flow aggressively */}
      {error ? (
        <span id={errorId} className={styles.error} role="alert" aria-live="polite">
          {error}
        </span>
      ) : helperText ? (
        <span id={helperId} className={styles.helperText}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
