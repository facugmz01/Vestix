import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Drawer.module.css';
import clsx from 'clsx';

interface Props {
  open:       boolean;
  title:      string;
  onClose:    () => void;
  children:   React.ReactNode;
  footer?:    React.ReactNode;
  width?:     'sm' | 'md' | 'lg';
  side?:      'right' | 'left';
}

/**
 * Slide-in drawer panel. Used for detail views and multi-step forms
 * where a modal would feel too intrusive.
 */
export function Drawer({ open, title, onClose, children, footer, width = 'md', side = 'right' }: Props) {
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    firstFocusRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose} aria-modal role="dialog" aria-label={title}>
      <aside
        className={clsx(styles.panel, styles[width], styles[side])}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button ref={firstFocusRef} className={styles.close} onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </aside>
    </div>
  );
}
