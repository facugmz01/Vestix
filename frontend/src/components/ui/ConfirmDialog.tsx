import { AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { Modal }  from './Modal';
import { Button } from './Button';
import styles from './ConfirmDialog.module.css';

interface Props {
  open:        boolean;
  title?:      string;
  message:     string;
  confirmLabel?: string;
  cancelLabel?:  string;
  variant?:    'danger' | 'warning';
  loading?:    boolean;
  onConfirm:   () => void;
  onCancel:    () => void;
}

/**
 * Destructive action confirmation dialog.
 * Always requires an explicit user action — never auto-confirms.
 */
export function ConfirmDialog({
  open, title = '¿Estás seguro?', message,
  confirmLabel = 'Confirmar', cancelLabel = 'Cancelar',
  variant = 'danger', loading, onConfirm, onCancel,
}: Props) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className={styles.confirmBody}>
        <div className={clsx(styles.iconWrap, variant === 'danger' ? styles.iconDanger : styles.iconWarning)}>
          <AlertTriangle size={24} color={variant === 'danger' ? 'var(--red)' : 'var(--yellow)'} />
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </Modal>
  );
}
