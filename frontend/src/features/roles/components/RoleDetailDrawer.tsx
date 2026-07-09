import { Drawer, Badge, StatusChip } from '@/components/ui';
import type { CustomRole } from '@/types';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  role: CustomRole | null;
}

export function RoleDetailDrawer({ open, onClose, role }: Props) {
  if (!role) return null;

  const groupedPerms = role.permissions.reduce((acc, perm) => {
    if (!acc[perm.subject]) acc[perm.subject] = [];
    acc[perm.subject].push(perm.action);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Rol" width="md">
      <div className={styles.stack}>
        <div>
          <div className={styles.entityTitleRow}>
            <h3 className={styles.entityTitle}>{role.name}</h3>
            {role.isSystem && <StatusChip label="Sistema" color="blue" size="sm" />}
          </div>
          {role.description && (
            <p className={styles.entitySubtitle}>{role.description}</p>
          )}
        </div>

        <div>
          <h4 className={styles.detailSectionTitle}>Permisos Asignados</h4>
          
          {Object.keys(groupedPerms).length === 0 ? (
            <p className={styles.metaLineMuted}>No tiene permisos asignados.</p>
          ) : (
            <div className={`grid-responsive ${styles.infoGrid}`}>
              {Object.entries(groupedPerms).map(([subject, actions]) => (
                <div key={subject} className={styles.permRow}>
                  <span className={styles.permSubject}>{subject}</span>
                  <div className={styles.badgeGroup}>
                    {actions.includes('manage') ? (
                      <Badge color="purple">manage (todos)</Badge>
                    ) : (
                      actions.map(a => <Badge key={a} color="gray">{a}</Badge>)
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
