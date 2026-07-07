import { Drawer, StatusChip } from '@/components/ui';
import type { SystemUser } from '@/types';
import { ROLE_LABELS } from '@/rbac/permissions';

interface Props {
  open: boolean;
  onClose: () => void;
  user: SystemUser | null;
}

export function UserDetailDrawer({ open, onClose, user }: Props) {
  if (!user) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Usuario" width="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Avatar Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 700
          }}>
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {user.fullName}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid-responsive grid-cols-2">
          <InfoBox label="Rol" value={ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role} />
          <InfoBox 
            label="Estado" 
            value={
              <StatusChip 
                label={user.isActive ? 'Activo' : 'Inactivo'} 
                color={user.isActive ? 'green' : 'gray'} 
              />
            } 
          />
          <InfoBox label="Sucursal" value={user.branchName || 'Sin sucursal'} />
          <InfoBox label="ID Usuario" value={user.id} />
          <InfoBox
            label="Fecha Creación"
            value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
          />
        </div>
      </div>
    </Drawer>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius)' }}>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}
