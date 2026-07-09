import { Drawer, StatusChip } from '@/components/ui';
import type { SystemUser } from '@/types';
import { ROLE_LABELS } from '@/rbac/permissions';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  user: SystemUser | null;
}

export function UserDetailDrawer({ open, onClose, user }: Props) {
  if (!user) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Usuario" width="sm">
      <div className={styles.stack}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className={styles.profileTitle}>{user.fullName}</h3>
            <p className={styles.profileMeta}>{user.email}</p>
          </div>
        </div>

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
    <div className={styles.infoCardSm}>
      <p className={styles.infoCardLabel}>{label}</p>
      <div className={styles.infoCardValue}>{value}</div>
    </div>
  );
}
