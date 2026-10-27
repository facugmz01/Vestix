import type { ReactNode } from 'react';
import clsx from 'clsx';
import styles from './FiltersBar.module.css';

export interface FilterPresetProps {
  label: ReactNode;
  active?: boolean;
  count?: number | string;
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

/** Individual quick preset filter chip / pill. */
export function FilterPreset({
  label,
  active,
  count,
  icon,
  onClick,
  className,
  disabled,
}: FilterPresetProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(
        styles.presetChip,
        active && styles.presetChipActive,
        className
      )}
      onClick={onClick}
    >
      {icon && <span className={styles.presetIcon}>{icon}</span>}
      <span className={styles.presetLabel}>{label}</span>
      {count !== undefined && <span className={styles.presetCount}>{count}</span>}
    </button>
  );
}

export interface FiltersBarProps {
  children?: ReactNode;
  /** Quick filter preset pills/chips slot (e.g. FilterPreset components or badges) */
  presets?: ReactNode;
  /** Right-side slot for action buttons or badges */
  actions?: ReactNode;
  className?: string;
  /** Optional explicit slot for search bar (alternative to passing in children) */
  search?: ReactNode;
  /** Optional explicit slot for filters (alternative to passing in children) */
  filters?: ReactNode;
}

/**
 * Horizontal container for filter controls (search, selects, date pickers)
 * with quick preset pills support and responsive wrapping.
 */
export function FiltersBar({ children, presets, actions, className, search, filters }: FiltersBarProps) {
  return (
    <div className={clsx(styles.container, className)}>
      {presets && <div className={styles.presets}>{presets}</div>}
      {(children || actions || search || filters) && (
        <div className={styles.bar}>
          {(children || search || filters) && (
            <div className={styles.filters}>
              {search}
              {children}
              {filters}
            </div>
          )}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
    </div>
  );
}
