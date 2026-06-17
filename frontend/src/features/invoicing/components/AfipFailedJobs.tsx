import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { afipApi } from '@/api/afip.api';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

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
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al reintentar');
    }
  });

  if (isLoading) return null;
  if (jobs.length === 0) return null;

  return (
    <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--red)' }}>
        <AlertTriangle size={24} />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Facturas AFIP Fallidas ({jobs.length})</h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {jobs.map((job) => (
          <div key={job.id} style={{ background: 'var(--bg-base)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 500 }}>
                {job.name === 'generate_invoice' ? `Factura Orden #${job.data?.orderId}` : `Nota Crédito #${job.data?.returnId}`}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--red)' }}>
                {job.failedReason || 'Error desconocido'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
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
