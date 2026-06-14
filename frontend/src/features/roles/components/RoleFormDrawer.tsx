import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { rolesApi, type CreateRoleDto } from '@/api/roles.api';
import { queryKeys } from '@/api/queryKeys';
import type { CustomRole, Permission } from '@/types';
import { Actions, Subjects } from '@/rbac/permissions';
import toast from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  roleToEdit?: CustomRole | null;
}

const AVAILABLE_ACTIONS = [Actions.READ, Actions.CREATE, Actions.UPDATE, Actions.DELETE, Actions.MANAGE];
const AVAILABLE_SUBJECTS = Object.values(Subjects).filter(s => s !== Subjects.ALL);

export function RoleFormDrawer({ open, onClose, roleToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!roleToEdit;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    if (open && roleToEdit) {
      setName(roleToEdit.name);
      setDescription(roleToEdit.description || '');
      setPermissions(roleToEdit.permissions || []);
    } else if (open && !roleToEdit) {
      setName('');
      setDescription('');
      setPermissions([]);
    }
  }, [open, roleToEdit]);

  const hasPermission = (action: string, subject: string) => {
    // If they have MANAGE or ALL, they implicitly have it, but for UI state we check exact match.
    return permissions.some(p => p.action === action && p.subject === subject);
  };

  const hasManage = (subject: string) => {
    return permissions.some(p => p.action === Actions.MANAGE && p.subject === subject);
  };

  const togglePermission = (action: string, subject: string, checked: boolean) => {
    if (checked) {
      if (action === Actions.MANAGE) {
        // If checking manage, we can just add manage.
        setPermissions(prev => [...prev.filter(p => p.subject !== subject), { action: Actions.MANAGE, subject }]);
      } else {
        setPermissions(prev => [...prev, { action, subject }]);
      }
    } else {
      if (action === Actions.MANAGE) {
        setPermissions(prev => prev.filter(p => !(p.action === Actions.MANAGE && p.subject === subject)));
      } else {
        setPermissions(prev => prev.filter(p => !(p.action === action && p.subject === subject)));
      }
    }
  };

  const toggleRow = (subject: string, checkAll: boolean) => {
    if (checkAll) {
      setPermissions(prev => [...prev.filter(p => p.subject !== subject), { action: Actions.MANAGE, subject }]);
    } else {
      setPermissions(prev => prev.filter(p => p.subject !== subject));
    }
  };

  const mutation = useMutation({
    mutationFn: (data: CreateRoleDto) => {
      if (isEditing && roleToEdit) return rolesApi.updateRole(roleToEdit.id, data);
      return rolesApi.createRole(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Rol actualizado' : 'Rol creado exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all() });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar rol');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre del rol es obligatorio');
      return;
    }
    mutation.mutate({ name, description, permissions });
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Rol' : 'Nuevo Rol'}
      onClose={onClose}
      width="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="grid-responsive">
          <Input
            label="Nombre del Rol"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={roleToEdit?.isSystem}
          />
          <Input
            label="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={roleToEdit?.isSystem}
          />
        </div>

        {roleToEdit?.isSystem && (
          <div style={{ padding: '12px', background: 'var(--yellow-bg)', color: 'var(--yellow)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
            Los roles de sistema no pueden ser modificados. Solo podés ver sus permisos.
          </div>
        )}

        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>
            Matriz de Permisos
          </h4>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead style={{ background: 'var(--bg-elevated)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Módulo</th>
                  {AVAILABLE_ACTIONS.map(action => (
                    <th key={action} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', textAlign: 'center', textTransform: 'capitalize' }}>
                      {action}
                    </th>
                  ))}
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>Todos</th>
                </tr>
              </thead>
              <tbody>
                {AVAILABLE_SUBJECTS.map(subject => {
                  const isManaged = hasManage(subject);
                  return (
                    <tr key={subject} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {subject}
                      </td>
                      {AVAILABLE_ACTIONS.map(action => {
                        const isChecked = isManaged || hasPermission(action, subject);
                        return (
                          <td key={action} style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={roleToEdit?.isSystem || (isManaged && action !== Actions.MANAGE)}
                              onChange={(e) => togglePermission(action, subject, e.target.checked)}
                              style={{ cursor: roleToEdit?.isSystem ? 'not-allowed' : 'pointer' }}
                            />
                          </td>
                        );
                      })}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isManaged}
                          disabled={roleToEdit?.isSystem}
                          onChange={(e) => toggleRow(subject, e.target.checked)}
                          style={{ cursor: roleToEdit?.isSystem ? 'not-allowed' : 'pointer' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
