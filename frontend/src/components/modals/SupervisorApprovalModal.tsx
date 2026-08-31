import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/ui';
import { authApi, type AuthorizeActionResult } from '@/api/auth.api';
import { ShieldAlert, KeyRound, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  action: string;
  actionLabel?: string;
  subject?: string;
  onApproved: (result: AuthorizeActionResult) => void;
}

export function SupervisorApprovalModal({
  open,
  onClose,
  action,
  actionLabel = 'Autorización Requerida',
  subject = 'Sales',
  onApproved,
}: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail('');
      setPassword('');
      setReason('');
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Ingresá el correo y la contraseña/PIN del supervisor');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.authorizeAction({
        email: email.trim(),
        password,
        action,
        subject,
        reason: reason.trim() || undefined,
      });

      toast.success(`Autorizado por ${res.supervisor.fullName || res.supervisor.email}`);
      onApproved(res);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error de autenticación del supervisor';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Autorización de Supervisor"
      onClose={onClose}
      size="sm"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', width: '100%' }}>
          <Button variant="ghost" onClick={onClose} disabled={loading} type="button">
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} type="button">
            <KeyRound size={16} style={{ marginRight: 6 }} />
            Autorizar Acción
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.75rem',
            background: 'var(--color-bg-subtle, #f8fafc)',
            border: '1px solid var(--color-border-subtle, #e2e8f0)',
            borderRadius: '8px',
          }}
        >
          <ShieldAlert size={22} color="var(--color-warning-500, #f59e0b)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #64748b)', lineHeight: '1.4' }}>
            <strong style={{ color: 'var(--color-text-primary, #0f172a)', display: 'block', marginBottom: 2 }}>
              {actionLabel}
            </strong>
            Esta acción requiere la validación de un <strong>Gerente de Tienda</strong> o <strong>Super Admin</strong>.
          </div>
        </div>

        <Input
          label="Email del Supervisor *"
          type="email"
          placeholder="supervisor@vestix.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Contraseña o PIN de Supervisor *"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          label="Motivo / Razón (Opcional)"
          type="text"
          placeholder="Ej: Descuento comercial por falla o cliente frecuente"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </form>
    </Modal>
  );
}
