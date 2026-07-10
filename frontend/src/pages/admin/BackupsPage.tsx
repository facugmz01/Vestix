import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database, Download, Trash2, RotateCcw, Plus, AlertTriangle,
  Clock, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  PageContainer, Section, Table, Button, Badge, Pagination,
  EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog,
} from '@/components/ui';
import { backupsApi } from '@/api/backups.api';
import { queryKeys } from '@/api/queryKeys';
import type { BackupJob } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';
import styles from './BackupsPage.module.css';

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:      { label: 'Pendiente',    color: 'gray',   icon: <Clock size={12} /> },
  IN_PROGRESS:  { label: 'En progreso',  color: 'blue',   icon: <Loader2 size={12} className="animate-spin" /> },
  COMPLETED:    { label: 'Completado',   color: 'green',  icon: <CheckCircle size={12} /> },
  FAILED:       { label: 'Fallido',      color: 'red',    icon: <XCircle size={12} /> },
};

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function BackupsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [restoreTarget, setRestoreTarget] = useState<BackupJob | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BackupJob | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.backups.all({ page, pageSize }),
    queryFn: () => backupsApi.list({ page, pageSize }),
    refetchInterval: (query) => {
      const jobs = query.state.data?.data ?? [];
      const hasActive = jobs.some((j) => j.status === 'PENDING' || j.status === 'IN_PROGRESS');
      return hasActive ? 3000 : false;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => backupsApi.create(),
    onSuccess: () => {
      toast.success('Backup iniciado');
      queryClient.invalidateQueries({ queryKey: queryKeys.backups.all() });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al crear backup'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => backupsApi.restore(id),
    onSuccess: () => {
      toast.success('Restauración iniciada');
      setRestoreTarget(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.backups.all() });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al restaurar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backupsApi.remove(id),
    onSuccess: () => {
      toast.success('Backup eliminado');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.backups.all() });
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al eliminar'),
  });

  const handleDownload = async (job: BackupJob) => {
    try {
      await backupsApi.download(job.id, job.filename ?? 'backup.sql');
      toast.success('Descarga iniciada');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al descargar';
      toast.error(message);
    }
  };

  const jobs = data?.data ?? [];
  const total = data?.total ?? 0;
  const hasActiveJob = jobs.some((j) => j.status === 'PENDING' || j.status === 'IN_PROGRESS');

  return (
    <PageContainer
      title="Backups y Recuperación"
      subtitle="Generá copias de seguridad de la base de datos y restaurá el sistema ante incidentes."
      action={
        <ActionGuard action="manage" subject="Backups">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || hasActiveJob}
          >
            Nuevo Backup
          </Button>
        </ActionGuard>
      }
    >
      <div className={styles.infoBanner}>
        <Database size={16} />
        <span>
          Los backups se generan con <strong>pg_dump</strong> en formato SQL.
          Se almacenan en el servidor y pueden descargarse para guardar una copia externa.
        </span>
      </div>

      <div className={styles.warningBanner}>
        <AlertTriangle size={18} />
        <span>
          <strong>Atención:</strong> La restauración sobrescribe todos los datos actuales de la base de datos.
          Solo ejecutala si estás seguro del punto de recuperación seleccionado.
        </span>
      </div>

      <Section>
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<Database size={40} />}
            title="Sin Backups"
            message="Todavía no hay copias de seguridad. Creá el primer backup para proteger tus datos."
            action={
              <ActionGuard action="manage" subject="Backups">
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => createMutation.mutate()}>
                  Crear primer backup
                </Button>
              </ActionGuard>
            }
          />
        ) : (
          <Table
            keyField="id"
            data={jobs}
            columns={[
              {
                key: 'date',
                header: 'Fecha',
                render: (j: BackupJob) => (
                  <span className={styles.cellDate}>
                    {new Date(j.createdAt).toLocaleString()}
                  </span>
                ),
              },
              {
                key: 'type',
                header: 'Tipo',
                render: (j: BackupJob) => (
                  <Badge color={j.type === 'RESTORE' ? 'orange' : 'gray'}>
                    {j.type === 'RESTORE' ? 'Restauración' : 'Backup'}
                  </Badge>
                ),
              },
              {
                key: 'filename',
                header: 'Archivo',
                render: (j: BackupJob) => (
                  <span className={styles.filename}>{j.filename ?? '—'}</span>
                ),
              },
              {
                key: 'size',
                header: 'Tamaño',
                render: (j: BackupJob) => (
                  <span className={styles.fileSize}>{formatFileSize(j.fileSize)}</span>
                ),
              },
              {
                key: 'status',
                header: 'Estado',
                render: (j: BackupJob) => {
                  const meta = STATUS_META[j.status] ?? { label: j.status, color: 'gray', icon: null };
                  return (
                    <Badge color={meta.color as 'green' | 'blue' | 'red' | 'gray' | 'orange'}>
                      {meta.icon} {meta.label}
                    </Badge>
                  );
                },
              },
              {
                key: 'user',
                header: 'Usuario',
                render: (j: BackupJob) => (
                  <span className={styles.fileSize}>{j.createdByEmail ?? '—'}</span>
                ),
              },
              {
                key: 'error',
                header: 'Error',
                render: (j: BackupJob) => j.error
                  ? <span className={styles.errorCell} title={j.error}>{j.error}</span>
                  : <span className={styles.emptyDash}>—</span>,
              },
              {
                key: 'actions',
                header: '',
                render: (j: BackupJob) => (
                  <div className={styles.actions}>
                    {j.status === 'COMPLETED' && j.type === 'MANUAL' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Download size={16} />}
                        onClick={() => handleDownload(j)}
                        aria-label="Descargar"
                      />
                    )}
                    {j.status === 'COMPLETED' && j.type === 'MANUAL' && (
                      <ActionGuard action="manage" subject="Backups">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<RotateCcw size={16} />}
                          onClick={() => setRestoreTarget(j)}
                          aria-label="Restaurar"
                        />
                      </ActionGuard>
                    )}
                    {j.type === 'MANUAL' && j.status !== 'PENDING' && j.status !== 'IN_PROGRESS' && (
                      <ActionGuard action="manage" subject="Backups">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => setDeleteTarget(j)}
                          aria-label="Eliminar"
                        />
                      </ActionGuard>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      <ConfirmDialog
        open={!!restoreTarget}
        title="Restaurar backup"
        message={
          restoreTarget
            ? `¿Confirmás restaurar la base de datos desde "${restoreTarget.filename}"? Todos los datos actuales serán reemplazados.`
            : ''
        }
        confirmLabel="Restaurar"
        variant="danger"
        loading={restoreMutation.isPending}
        onConfirm={() => restoreTarget && restoreMutation.mutate(restoreTarget.id)}
        onCancel={() => setRestoreTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar backup"
        message={
          deleteTarget
            ? `¿Eliminar el backup "${deleteTarget.filename}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  );
}
