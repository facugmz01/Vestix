import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table, Input } from '@/components/ui';
import { transfersApi } from '@/api/transfers.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Truck, CheckCircle, Package, ArrowRight, XCircle } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatEntityId } from '@/utils/formatId';

interface Props {
  open: boolean;
  onClose: () => void;
  transferId: string | null;
}

export function TransferDetailDrawer({ open, onClose, transferId }: Props) {
  const queryClient = useQueryClient();

  // Reception State
  const [receiving, setReceiving] = useState(false);
  const [receptionLines, setReceptionLines] = useState<Record<string, number>>({});

  // Dispatch State
  const [trackingNumber, setTrackingNumber] = useState('');

  const { data: transfer, isLoading } = useQuery({
    queryKey: queryKeys.transfers.detail(transferId || ''),
    queryFn: () => transfersApi.getTransfer(transferId!),
    enabled: open && !!transferId,
  });

  useEffect(() => {
    if (transfer && transfer.status === 'IN_TRANSIT' && !receiving) {
      // Pre-fill reception quantities with expected quantities
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-muted)' }}>Transferencia / Remito ID</p>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, fontFamily: 'monospace' }}>{formatEntityId(transfer.id, 'TRF-')}</h3>
            {transfer.trackingNumber && <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Tracking: <strong>{transfer.trackingNumber}</strong></p>}
          </div>
          <div style={{ textAlign: 'center' }}>
            <Badge color={getStatusColor(transfer.status)}>{transfer.status}</Badge>
          </div>
        </div>

        {/* Route */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-muted)' }}>Origen</p>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{transfer.sourceWarehouseName || 'Depósito Origen'}</p>
          </div>
          <ArrowRight size={24} color="var(--text-muted)" style={{ margin: '0 16px' }} />
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-muted)' }}>Destino</p>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{transfer.destinationWarehouseName || 'Depósito Destino'}</p>
          </div>
        </div>

        {/* Lines */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} /> Artículos ({transfer.lines.length})
          </h4>
          
          <Table
            keyField="variantId"
            data={transfer.lines}
            columns={[
              { key: 'sku', header: 'SKU', render: (l) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.variantSku || l.variantId}</span> },
              { key: 'product', header: 'Producto', render: (l) => l.productName || 'Producto Desconocido' },
              { key: 'qty', header: 'Cant. Solicitada', render: (l) => <span style={{ fontWeight: 'bold' }}>{l.quantity}</span> },
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
                        style={{ width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px' }}
                      />
                    );
                  }
                  if (transfer.status === 'COMPLETED') {
                    const diff = (l.receivedQuantity || 0) - l.quantity;
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 'bold' }}>{l.receivedQuantity || 0}</span>
                        {diff < 0 && <Badge color="red">Faltante ({diff})</Badge>}
                        {diff > 0 && <Badge color="warning">Sobrante (+{diff})</Badge>}
                        {diff === 0 && <CheckCircle size={14} color="var(--green)" />}
                      </div>
                    );
                  }
                  return <span style={{ color: 'var(--text-muted)' }}>Pendiente</span>;
                }
              }
            ]}
          />
        </div>

        {/* Actions Contextual to Status */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          
          {transfer.status === 'DRAFT' && (
            <ActionGuard action="manage" subject="Inventory">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', width: '100%' }}>
                <div style={{ flex: 1 }}>
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
            <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setReceiving(false)}>Cancelar</Button>
              <Button variant="primary" onClick={() => receiveMutation.mutate()} loading={receiveMutation.isPending}>
                Confirmar Remito Físico
              </Button>
            </div>
          )}

          {transfer.status === 'COMPLETED' && (
            <div style={{ padding: '12px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 'var(--radius)', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight: 600 }}>Transferencia Completada e Ingresada al Inventario.</span>
            </div>
          )}

          {transfer.status === 'CANCELLED' && (
            <div style={{ padding: '12px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 'var(--radius)', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={20} />
              <span style={{ fontWeight: 600 }}>Solicitud Cancelada.</span>
            </div>
          )}

        </div>

      </div>
    </Drawer>
  );
}
