import { AlertTriangle } from 'lucide-react';
import { Modal }  from './Modal';
import { Button } from './Button';

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
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, textAlign:'center', padding:'8px 0' }}>
        <div style={{
          width:52, height:52, borderRadius:'50%',
          background: variant === 'danger' ? 'var(--red-bg)' : 'var(--yellow-bg)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <AlertTriangle size={24} color={variant === 'danger' ? 'var(--red)' : 'var(--yellow)'} />
        </div>
        <p style={{ fontSize:14, color:'var(--text-secondary)', lineHeight:1.6 }}>{message}</p>
      </div>
    </Modal>
  );
}
