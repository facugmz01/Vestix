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
 *
 * @example
 * <ActionGuard action="delete" subject="Catalog" onDeny="disable">
 *   <Button variant="danger">Eliminar producto</Button>
 * </ActionGuard>
 */
export function ActionGuard({
  action,
  subject,
  children,
  onDeny = 'hide',
  denyTitle = 'No tenés permiso para esta acción',
  onClick,
  ...rest
}: ActionGuardProps) {
  const { can } = usePermissions();
  const allowed  = can(action, subject);

  if (!allowed && onDeny === 'hide') return null;

  return (
    <span
      title={!allowed ? denyTitle : undefined}
      style={!allowed ? { cursor: 'not-allowed', display: 'inline-flex' } : undefined}
    >
      {/* Cloning children to inject disabled and blocked onClick when denied */}
      {typeof children === 'object' && children !== null
        ? (() => {
            const child = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
            return !allowed
              ? { ...child, props: { ...child.props, disabled: true, onClick: undefined, style: { ...child.props?.style, pointerEvents: 'none', opacity: 0.45 } } }
              : child;
          })()
        : children}
    </span>
  );
}
