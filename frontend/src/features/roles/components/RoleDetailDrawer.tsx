import { Drawer, Badge, StatusChip } from '@/components/ui';
import type { CustomRole } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  role: CustomRole | null;
}

export function RoleDetailDrawer({ open, onClose, role }: Props) {
  if (!role) return null;

  // Group permissions by subject for easier reading
  const groupedPerms = role.permissions.reduce((acc, perm) => {
    if (!acc[perm.subject]) acc[perm.subject] = [];
    acc[perm.subject].push(perm.action);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Rol" width="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {role.name}
            </h3>
            {role.isSystem && <StatusChip label="Sistema" color="blue" size="sm" />}
          </div>
          {role.description && (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              {role.description}
            </p>
          )}
        </div>

        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            Permisos Asignados
          </h4>
          
          {Object.keys(groupedPerms).length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No tiene permisos asignados.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {Object.entries(groupedPerms).map(([subject, actions]) => (
                <div key={subject} style={{ background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {subject}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
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
