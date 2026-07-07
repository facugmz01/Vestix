import React, { cloneElement, isValidElement } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { usePermissions } from './usePermissions';
import type { Action, Subject } from './permissions';

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
      <span title={denyTitle} style={{ cursor: 'not-allowed', display: 'inline-flex' }}>
        {cloneElement(children as React.ReactElement, {
          disabled: true,
          onClick: undefined,
          style: {
            ...(children.props as { style?: React.CSSProperties }).style,
            pointerEvents: 'none',
            opacity: 0.45,
          },
        })}
      </span>
    );
  }

  return <>{children}</>;
}
