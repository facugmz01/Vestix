import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { rolesApi, type CreateRoleDto } from '@/api/roles.api';
import { queryKeys } from '@/api/queryKeys';
import type { CustomRole, Permission } from '@/types';
import { Actions, Subjects } from '@/rbac/permissions';
import toast from 'react-hot-toast';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  roleToEdit?: CustomRole | null;
}

const AVAILABLE_ACTIONS = [Actions.READ, Actions.CREATE, Actions.UPDATE, Actions.DELETE, Actions.MANAGE];
const AVAILABLE_SUBJECTS = Object.values(Subjects).filter(s => s !== Subjects.ALL);
const MATRIX_ACTIONS = [...AVAILABLE_ACTIONS, 'print'] as const;
const CUSTOM_ACTIONS_BY_SUBJECT: Record<string, string[]> = {
  [Subjects.LABELS]: ['print'],
};

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
    return permissions.some(p => p.action === action && p.subject === subject);
  };

  const hasManage = (subject: string) => {
    return permissions.some(p => p.action === Actions.MANAGE && p.subject === subject);
  };

  const togglePermission = (action: string, subject: string, checked: boolean) => {
    if (checked) {
      if (action === Actions.MANAGE) {
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
    mutation.mutate({ name, permissions });
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
      <form onSubmit={handleSubmit} className={styles.formStack}>
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
          <div className={styles.alertYellow}>
            Los roles de sistema no pueden ser modificados. Solo podés ver sus permisos.
          </div>
        )}

        <div>
          <h4 className={styles.sectionHeadingMd}>Matriz de Permisos</h4>
          <div className={styles.permissionsTableWrap}>
            <table className={styles.permissionsTable}>
              <thead className={styles.permissionsThead}>
                <tr>
                  <th className={styles.permissionsTh}>Módulo</th>
                  {MATRIX_ACTIONS.map(action => (
                    <th key={action} className={styles.permissionsThCenter}>{action}</th>
                  ))}
                  <th className={styles.permissionsThCenter}>Todos</th>
                </tr>
              </thead>
              <tbody>
                {AVAILABLE_SUBJECTS.map(subject => {
                  const isManaged = hasManage(subject);
                  return (
                    <tr key={subject} className={styles.permissionsTr}>
                      <td className={styles.permissionsTdSubject}>{subject}</td>
                      {MATRIX_ACTIONS.map(action => {
                        const supportsAction =
                          AVAILABLE_ACTIONS.includes(action as typeof Actions[keyof typeof Actions]) ||
                          (CUSTOM_ACTIONS_BY_SUBJECT[subject] ?? []).includes(action);
                        const isChecked = isManaged || hasPermission(action, subject);
                        const isDisabled = !supportsAction || roleToEdit?.isSystem || (isManaged && action !== Actions.MANAGE);
                        return (
                          <td key={action} className={styles.permissionsTdCenter}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDisabled}
                              onChange={(e) => togglePermission(action, subject, e.target.checked)}
                              className={isDisabled ? styles.checkboxDisabled : styles.checkboxEnabled}
                            />
                          </td>
                        );
                      })}
                      <td className={styles.permissionsTdCenter}>
                        <input
                          type="checkbox"
                          checked={isManaged}
                          disabled={roleToEdit?.isSystem}
                          onChange={(e) => toggleRow(subject, e.target.checked)}
                          className={roleToEdit?.isSystem ? styles.checkboxDisabled : styles.checkboxEnabled}
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
