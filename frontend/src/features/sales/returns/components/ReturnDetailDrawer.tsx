import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table } from '@/components/ui';
import { returnsApi } from '@/api/returns.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId, formatShortId } from '@/utils/formatId';

interface Props {
  open: boolean;
  onClose: () => void;
  returnId: string | null;
}

export function ReturnDetailDrawer({ open, onClose, returnId }: Props) {
  const queryClient = useQueryClient();

  const { data: rma, isLoading } = useQuery({
    queryKey: queryKeys.returns.detail(returnId || ''),
    queryFn: () => returnsApi.getReturn(returnId!),
    enabled: open && !!returnId,
  });

  const approveMutation = useMutation({
    mutationFn: () => returnsApi.approveReturn(returnId!),
    onSuccess: () => {
      toast.success('Devolución Aprobada. Stock reingresado.');
      queryClient.invalidateQueries({ queryKey: queryKeys.returns.detail(returnId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.returns.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al aprobar'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => returnsApi.rejectReturn(returnId!),
    onSuccess: () => {
      toast.success('Solicitud rechazada y anulada.');
      queryClient.invalidateQueries({ queryKey: queryKeys.returns.detail(returnId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.returns.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al rechazar'),
  });

  if (!returnId || isLoading || !rma) {
    return <Drawer open={open} onClose={onClose} title="Cargando..." width="lg"><div /></Drawer>;
  }


  const getStatusColor = (s: string) => {
    if (s === 'PENDING') return 'orange';
    if (s === 'APPROVED') return 'green';
    return 'red';
  };

  const getActionColor = (a: string) => {
    if (a === 'REFUND') return 'blue';
    if (a === 'EXCHANGE') return 'purple';
    return 'gray';
  };

  return (
    <Drawer open={open} onClose={onClose} title="Auditoría de Devolución (RMA)" width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-muted)' }}>ID Solicitud / Ticket Ref</p>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, fontFamily: 'monospace' }}>{formatShortId(rma.id)}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Ticket Orig: <span style={{ fontFamily: 'monospace' }}>{formatSaleId(rma.saleOrderId)}</span></p>
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Badge color={getStatusColor(rma.status)}>{rma.status}</Badge>
            <Badge color={getActionColor(rma.action)}>{rma.action}</Badge>
          </div>
        </div>

        {/* Amount Box */}
        <div style={{ padding: '16px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--text-muted)' }}>Monto a favor del cliente</p>
            <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>{formatCurrency(rma.totalRefundAmount)}</h2>
          </div>
          <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '200px' }}>
            {rma.action === 'EXCHANGE' ? 'Al aprobarse, el cliente podrá usar este saldo para llevar otro artículo.' : 'Al aprobarse, se extraerá este monto de la caja/cuenta correspondiente.'}
          </div>
        </div>

        {/* Lines */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Artículos Entregados Físicamente
          </h4>
          
          <Table
            keyField="id"
            data={rma.items}
            columns={[
              { key: 'sku', header: 'SKU', render: (l) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.variantSku || l.variantId}</span> },
              { key: 'qty', header: 'Cant. Devuelta', render: (l) => <span style={{ fontWeight: 'bold' }}>{l.quantity}</span> },
              { 
                key: 'cond', 
                header: 'Condición Física', 
                render: (l) => {
                  let color = 'green';
                  if (l.condition === 'DAMAGED') color = 'orange';
                  if (l.condition === 'DEFECTIVE') color = 'red';
                  return <Badge color={color as any}>{l.condition}</Badge>;
                }
              },
              { key: 'refund', header: 'Monto Reconocido', render: (l) => <span style={{ fontWeight: 800 }}>{formatCurrency(l.refundAmount)}</span> }
            ]}
          />
        </div>

        {/* Contextual Actions */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          
          {rma.status === 'PENDING' && (
            <ActionGuard action="manage" subject="Sales">
              <Button variant="ghost" onClick={() => rejectMutation.mutate()} loading={rejectMutation.isPending} disabled={approveMutation.isPending}>
                Rechazar (Denegar Devolución)
              </Button>
              <Button variant="primary" onClick={() => approveMutation.mutate()} loading={approveMutation.isPending} disabled={rejectMutation.isPending} icon={<CheckCircle size={16} />}>
                Aprobar e Ingresar Mercadería
              </Button>
            </ActionGuard>
          )}

          {rma.status === 'APPROVED' && (
            <div style={{ padding: '12px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 'var(--radius)', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight: 600 }}>Solicitud Completada. Stock sumado, fondos acreditados al cliente.</span>
            </div>
          )}

          {rma.status === 'REJECTED' && (
            <div style={{ padding: '12px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 'var(--radius)', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={20} />
              <span style={{ fontWeight: 600 }}>Solicitud Denegada. Sin efecto comercial.</span>
            </div>
          )}

        </div>

      </div>
    </Drawer>
  );
}
