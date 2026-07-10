import React, { cloneElement, isValidElement } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { usePermissions } from './usePermissions';
import type { Action, Subject } from './permissions';
import styles from './ActionGuard.module.css';

interface ActionGuardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  action:   Action | string;
  subject:  Subject | string;
  children: ReactNode;
  /** When denied: 'hide' removes from DOM, 'disable' renders it greyed out */
  onDeny?: 'hide' | 'disable';
  /** Tooltip shown when the button is disabled due to insufficient permissions */
  denyTitle?: string;
}

/**
 * Wraps any clickable element with an RBAC check.
 * Avoids scattered `can(...)` checks across every component.
 */
export function ActionGuard({
  action,
  subject,
  children,
  onDeny = 'hide',
  denyTitle = 'No tenés permiso para esta acción',
}: ActionGuardProps) {
  const { can } = usePermissions();
  const allowed  = can(action, subject);

  if (!allowed && onDeny === 'hide') return null;

  if (!isValidElement(children)) {
    return <>{children}</>;
  }

  if (!allowed && onDeny === 'disable') {
    return (
      <span className={styles.deniedWrap} title={denyTitle}>
        {cloneElement(children as React.ReactElement, {
          disabled: true,
          onClick: undefined,
          className: clsx(
            (children.props as { className?: string }).className,
            styles.deniedChild,
          ),
        })}
      </span>
    );
  }

  return <>{children}</>;
}
