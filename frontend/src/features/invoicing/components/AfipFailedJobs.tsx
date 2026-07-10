import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { afipApi } from '@/api/afip.api';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import styles from '@/styles/DetailDrawerShared.module.css';

export function AfipFailedJobs() {
  const qc = useQueryClient();
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['afip-failed-jobs'],
    queryFn: afipApi.getFailedJobs,
  });

  const retryMutation = useMutation({
    mutationFn: afipApi.retryJob,
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ['afip-failed-jobs'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Error al reintentar');
    }
  });

  if (isLoading) return null;
  if (jobs.length === 0) return null;

  return (
    <div className={styles.failedJobsPanel}>
      <div className={styles.failedJobsHeader}>
        <AlertTriangle size={24} />
        <h3 className={styles.failedJobsTitle}>Facturas AFIP Fallidas ({jobs.length})</h3>
      </div>
      
      <div className={styles.failedJobsList}>
        {jobs.map((job) => (
          <div key={job.id} className={styles.failedJobRow}>
            <div>
              <p className={styles.failedJobTitle}>
                {job.name === 'generate_invoice' ? `Factura Orden #${job.data?.orderId}` : `Nota Crédito #${job.data?.returnId}`}
              </p>
              <p className={styles.failedJobError}>
                {job.failedReason || 'Error desconocido'}
              </p>
              <p className={styles.hintSm}>
                Intentos: {job.attemptsMade} | Falló el: {new Date(job.failedAt).toLocaleString()}
              </p>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={retryMutation.isPending && retryMutation.variables === job.id ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />}
              onClick={() => retryMutation.mutate(job.id)}
              disabled={retryMutation.isPending}
            >
              Reintentar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
