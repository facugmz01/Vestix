import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table } from '@/components/ui';
import { returnsApi } from '@/api/returns.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId, formatShortId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';


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
      <div className={styles.stack}>
        
        {/* Header */}
        <div className={styles.heroCard}>
          <div>
            <p className={styles.heroLabel}>ID Solicitud / Ticket Ref</p>
            <h3 className={styles.heroTitle}>{formatShortId(rma.id)}</h3>
            <p className={styles.heroSubtitle}>Ticket Orig: <span className={styles.mono}>{formatSaleId(rma.saleOrderId)}</span></p>
          </div>
          <div className={styles.heroAsideStack}>
            <Badge color={getStatusColor(rma.status)}>{rma.status}</Badge>
            <Badge color={getActionColor(rma.action)}>{rma.action}</Badge>
          </div>
        </div>

        {/* Amount Box */}
        <div className={styles.rmaAmountPanel}>
          <div>
            <p className={styles.rmaAmountLabel}>Monto a favor del cliente</p>
            <h2 className={styles.rmaAmountValue}>{formatCurrency(rma.totalRefundAmount)}</h2>
          </div>
          <div className={styles.rmaAmountAside}>
            {rma.action === 'EXCHANGE' ? 'Al aprobarse, el cliente podrá usar este saldo para llevar otro artículo.' : 'Al aprobarse, se extraerá este monto de la caja/cuenta correspondiente.'}
          </div>
        </div>

        {/* Lines */}
        <div>
          <h4 className={styles.sectionHeading}>
            Artículos Entregados Físicamente
          </h4>
          
          <Table
            keyField="id"
            data={rma.items}
            columns={[
              { key: 'sku', header: 'SKU', render: (l) => <span className={styles.monoBold}>{l.variantSku || l.variantId}</span> },
              { key: 'qty', header: 'Cant. Devuelta', render: (l) => <span className={styles.textBold}>{l.quantity}</span> },
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
              { key: 'refund', header: 'Monto Reconocido', render: (l) => <span className={styles.textStrong}>{formatCurrency(l.refundAmount)}</span> }
            ]}
          />
        </div>

        {/* Contextual Actions */}
        <div className={styles.footerBetween}>
          
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
            <div className={styles.alertGreenFull}>
              <CheckCircle size={20} />
              <span className={styles.textMedium}>Solicitud Completada. Stock sumado, fondos acreditados al cliente.</span>
            </div>
          )}

          {rma.status === 'REJECTED' && (
            <div className={styles.alertRedFull}>
              <XCircle size={20} />
              <span className={styles.textMedium}>Solicitud Denegada. Sin efecto comercial.</span>
            </div>
          )}

        </div>

      </div>
    </Drawer>
  );
}
