import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import { Plus, Edit2, Trash2, Copy, Star, Tag, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  PageContainer, Button, Table, EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, Tabs, Badge,
} from '@/components/ui';
import { labelsApi } from '@/api/labels.api';
import { ActionGuard } from '@/rbac/ActionGuard';
import { exportTemplateToJson, parseImportedTemplate } from '@/features/labels/utils/labelExport';
import type { LabelTemplate } from '@/features/labels/types/label.types';

export default function LabelTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<LabelTemplate | null>(null);

  const { data: templates = [], isLoading, error, refetch } = useQuery({
    queryKey: ['labelTemplates'],
    queryFn: () => labelsApi.getTemplates(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => labelsApi.deleteTemplate(id),
    onSuccess: () => {
      toast.success('Plantilla eliminada');
      queryClient.invalidateQueries({ queryKey: ['labelTemplates'] });
      setDeleteOpen(false);
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'No se pudo eliminar'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => labelsApi.duplicateTemplate(id),
    onSuccess: () => {
      toast.success('Plantilla duplicada');
      queryClient.invalidateQueries({ queryKey: ['labelTemplates'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al duplicar'),
  });

  const importMutation = useMutation({
    mutationFn: (dto: ReturnType<typeof parseImportedTemplate>) => labelsApi.createTemplate(dto),
    onSuccess: () => {
      toast.success('Plantilla importada');
      queryClient.invalidateQueries({ queryKey: ['labelTemplates'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al importar'),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: string) => labelsApi.setDefaultTemplate(id),
    onSuccess: () => {
      toast.success('Plantilla marcada como predeterminada');
      queryClient.invalidateQueries({ queryKey: ['labelTemplates'] });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al actualizar'),
  });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const dto = parseImportedTemplate(JSON.parse(text));
      importMutation.mutate(dto);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Archivo inválido');
    }
    e.target.value = '';
  };

  return (
    <PageContainer
      title="Plantillas de Etiquetas"
      actions={
        <ActionGuard action="manage" subject="Labels">
          <div style={{ display: 'flex', gap: 8 }}>
            <input ref={fileInputRef} type="file" accept=".json" hidden onChange={handleImport} />
            <Button variant="ghost" icon={<Upload size={16} />} onClick={() => fileInputRef.current?.click()}>
              Importar
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/admin/label-templates/new/edit')}>
              Nueva plantilla
            </Button>
          </div>
        </ActionGuard>
      }
    >
      <Tabs items={CATALOG_TABS} />

      {error ? (
        <ApiErrorDisplay error={error} onRetry={refetch} />
      ) : isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<Tag size={40} />}
          title="Sin plantillas"
          description="Creá una plantilla para personalizar el diseño de tus etiquetas."
          action={
            <ActionGuard action="manage" subject="Labels">
              <Button variant="primary" onClick={() => navigate('/admin/label-templates/new/edit')}>
                Crear plantilla
              </Button>
            </ActionGuard>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tamaño</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th style={{ width: 200 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((tpl) => (
              <tr key={tpl.id}>
                <td>
                  <div style={{ fontWeight: 500 }}>{tpl.name}</div>
                  {tpl.description && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tpl.description}</div>
                  )}
                </td>
                <td>{tpl.labelWidth} × {tpl.labelHeight} mm</td>
                <td>{tpl.paperType === 'ROLL' ? 'Rollo' : 'Hoja'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {tpl.isDefault && <Badge color="green">Default</Badge>}
                    {tpl.isSystem && <Badge color="gray">Sistema</Badge>}
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <ActionGuard action="manage" subject="Labels">
                      <Button variant="ghost" size="sm" icon={<Edit2 size={14} />} onClick={() => navigate(`/admin/label-templates/${tpl.id}/edit`)} title="Editor visual" />
                      <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => exportTemplateToJson(tpl)} title="Exportar JSON" />
                      <Button variant="ghost" size="sm" icon={<Copy size={14} />} onClick={() => duplicateMutation.mutate(tpl.id)} title="Duplicar" />
                      {!tpl.isDefault && (
                        <Button variant="ghost" size="sm" icon={<Star size={14} />} onClick={() => defaultMutation.mutate(tpl.id)} title="Marcar default" />
                      )}
                      {!tpl.isSystem && (
                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => { setSelected(tpl); setDeleteOpen(true); }} title="Eliminar" />
                      )}
                    </ActionGuard>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => selected && deleteMutation.mutate(selected.id)}
        title="Eliminar plantilla"
        message={`¿Eliminar la plantilla "${selected?.name}"?`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </PageContainer>
  );
}
