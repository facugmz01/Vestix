import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table, Input } from '@/components/ui';
import { transfersApi } from '@/api/transfers.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Truck, CheckCircle, Package, ArrowRight, XCircle } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatEntityId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  transferId: string | null;
}

export function TransferDetailDrawer({ open, onClose, transferId }: Props) {
  const queryClient = useQueryClient();

  const [receiving, setReceiving] = useState(false);
  const [receptionLines, setReceptionLines] = useState<Record<string, number>>({});
  const [trackingNumber, setTrackingNumber] = useState('');

  const { data: transfer, isLoading } = useQuery({
    queryKey: queryKeys.transfers.detail(transferId || ''),
    queryFn: () => transfersApi.getTransfer(transferId!),
    enabled: open && !!transferId,
  });

  useEffect(() => {
    if (transfer && transfer.status === 'IN_TRANSIT' && !receiving) {
      const initial = transfer.lines.reduce((acc, line) => ({ ...acc, [line.variantId]: line.quantity }), {});
      setReceptionLines(initial);
    }
  }, [transfer, receiving]);

  const dispatchMutation = useMutation({
    mutationFn: () => transfersApi.dispatchTransfer(transferId!, { trackingNumber }),
    onSuccess: () => {
      toast.success('Mercadería despachada. Estado: EN TRÁNSITO.');
      queryClient.invalidateQueries({ queryKey: queryKeys.transfers.detail(transferId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transfers.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al despachar'),
  });

  const receiveMutation = useMutation({
    mutationFn: () => {
      const lines = Object.entries(receptionLines).map(([variantId, receivedQuantity]) => ({ variantId, receivedQuantity }));
      return transfersApi.receiveTransfer(transferId!, { lines });
    },
    onSuccess: () => {
      toast.success('Recepción completada y diferencias registradas.');
      queryClient.invalidateQueries({ queryKey: queryKeys.transfers.detail(transferId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transfers.all() });
      setReceiving(false);
    },
    onError: (err: any) => toast.error(err.message || 'Error en la recepción'),
  });

  if (!transferId || isLoading || !transfer) {
    return <Drawer open={open} onClose={onClose} title="Cargando..." width="lg"><div /></Drawer>;
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'gray';
      case 'IN_TRANSIT': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Gestión de Transferencia" width="lg">
      <div className={styles.stack}>

        <div className={styles.heroCard}>
          <div>
            <p className={styles.heroLabel}>Transferencia / Remito ID</p>
            <h3 className={styles.heroTitleNeutral}>{formatEntityId(transfer.id, 'TRF-')}</h3>
            {transfer.trackingNumber && (
              <p className={styles.trackingMeta}>Tracking: <strong>{transfer.trackingNumber}</strong></p>
            )}
          </div>
          <div className={styles.heroMeta}>
            <Badge color={getStatusColor(transfer.status)}>{transfer.status}</Badge>
          </div>
        </div>

        <div className={styles.routeCard}>
          <div className={styles.routeEndpoint}>
            <p className={styles.routeLabel}>Origen</p>
            <p className={styles.routeName}>{transfer.sourceWarehouseName || 'Depósito Origen'}</p>
          </div>
          <ArrowRight size={24} className={styles.routeArrow} />
          <div className={styles.routeEndpoint}>
            <p className={styles.routeLabel}>Destino</p>
            <p className={styles.routeName}>{transfer.destinationWarehouseName || 'Depósito Destino'}</p>
          </div>
        </div>

        <div>
          <h4 className={styles.sectionHeading}>
            <Package size={18} /> Artículos ({transfer.lines.length})
          </h4>

          <Table
            keyField="variantId"
            data={transfer.lines}
            columns={[
              { key: 'sku', header: 'SKU', render: (l) => <span className={styles.monoBold}>{l.variantSku || l.variantId}</span> },
              { key: 'product', header: 'Producto', render: (l) => l.productName || 'Producto Desconocido' },
              { key: 'qty', header: 'Cant. Solicitada', render: (l) => <span className={styles.textBold}>{l.quantity}</span> },
              {
                key: 'received',
                header: receiving ? 'Ingresar Cant.' : 'Cant. Recibida',
                render: (l) => {
                  if (receiving) {
                    return (
                      <input
                        type="number"
                        min="0"
                        value={receptionLines[l.variantId] ?? ''}
                        onChange={e => setReceptionLines({ ...receptionLines, [l.variantId]: Number(e.target.value) })}
                        className={styles.qtyInput}
                      />
                    );
                  }
                  if (transfer.status === 'COMPLETED') {
                    const diff = (l.receivedQuantity || 0) - l.quantity;
                    return (
                      <div className={styles.receivedRow}>
                        <span className={styles.textBold}>{l.receivedQuantity || 0}</span>
                        {diff < 0 && <Badge color="red">Faltante ({diff})</Badge>}
                        {diff > 0 && <Badge color="warning">Sobrante (+{diff})</Badge>}
                        {diff === 0 && <CheckCircle size={14} color="var(--green)" />}
                      </div>
                    );
                  }
                  return <span className={styles.textMuted}>Pendiente</span>;
                }
              }
            ]}
          />
        </div>

        <div className={styles.footerBetween}>

          {transfer.status === 'DRAFT' && (
            <ActionGuard action="manage" subject="Inventory">
              <div className={styles.dispatchRow}>
                <div className={styles.dispatchInput}>
                  <Input
                    label="Tracking de Transporte (Opcional)"
                    placeholder="Ej: OCA-123456"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                  />
                </div>
                <Button variant="primary" onClick={() => dispatchMutation.mutate()} loading={dispatchMutation.isPending} icon={<Truck size={16} />}>
                  Despachar (Sale Mercadería)
                </Button>
              </div>
            </ActionGuard>
          )}

          {transfer.status === 'IN_TRANSIT' && !receiving && (
            <ActionGuard action="manage" subject="Inventory">
              <Button variant="primary" onClick={() => setReceiving(true)} icon={<CheckCircle size={16} />}>
                Iniciar Recepción en Destino
              </Button>
            </ActionGuard>
          )}

          {transfer.status === 'IN_TRANSIT' && receiving && (
            <div className={styles.actionFooterFull}>
              <Button variant="ghost" onClick={() => setReceiving(false)}>Cancelar</Button>
              <Button variant="primary" onClick={() => receiveMutation.mutate()} loading={receiveMutation.isPending}>
                Confirmar Remito Físico
              </Button>
            </div>
          )}

          {transfer.status === 'COMPLETED' && (
            <div className={styles.alertGreenFull}>
              <CheckCircle size={20} />
              <span className={styles.alertText}>Transferencia Completada e Ingresada al Inventario.</span>
            </div>
          )}

          {transfer.status === 'CANCELLED' && (
            <div className={styles.alertRedFull}>
              <XCircle size={20} />
              <span className={styles.alertText}>Solicitud Cancelada.</span>
            </div>
          )}

        </div>

      </div>
    </Drawer>
  );
}
