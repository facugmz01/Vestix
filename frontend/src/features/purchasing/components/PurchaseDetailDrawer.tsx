import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table } from '@/components/ui';
import { purchasesApi } from '@/api/purchases.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Truck, CheckCircle, Package, XCircle, Send } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';

interface Props {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
}

export function PurchaseDetailDrawer({ open, onClose, orderId }: Props) {
  const queryClient = useQueryClient();

  const [receiving, setReceiving] = useState(false);
  const [receptionLines, setReceptionLines] = useState<Record<string, number>>({});

  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.purchases.detail(orderId || ''),
    queryFn: () => purchasesApi.getOrder(orderId!),
    enabled: open && !!orderId,
  });

  useEffect(() => {
    if (order && (order.status === 'ISSUED' || order.status === 'PARTIALLY_RECEIVED') && !receiving) {
      // Pre-fill reception with remaining quantities to speed up full reception
      const initial = order.lines.reduce((acc, line) => ({ 
        ...acc, 
        [line.variantId]: Math.max(0, line.orderedQuantity - line.receivedQuantity) 
      }), {});
      setReceptionLines(initial);
    }
  }, [order, receiving]);

  const issueMutation = useMutation({
    mutationFn: () => purchasesApi.issueOrder(orderId!),
    onSuccess: () => {
      toast.success('Orden Emitida al proveedor');
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.detail(orderId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al emitir orden'),
  });

  const receiveMutation = useMutation({
    mutationFn: () => {
      const lines = Object.entries(receptionLines).map(([variantId, qty]) => ({ variantId, receivedQuantity: qty }));
      return purchasesApi.receiveOrder(orderId!, { lines });
    },
    onSuccess: () => {
      toast.success('Recepción registrada');
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.detail(orderId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() });
      setReceiving(false);
    },
    onError: (err: any) => toast.error(err.message || 'Error en la recepción'),
  });

  if (!orderId || isLoading || !order) {
    return <Drawer open={open} onClose={onClose} title="Cargando..." width="lg"><div /></Drawer>;
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'gray';
      case 'ISSUED': return 'blue';
      case 'PARTIALLY_RECEIVED': return 'orange';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <Drawer open={open} onClose={onClose} title="Orden de Compra" width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-muted)' }}>OC ID</p>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, fontFamily: 'monospace' }}>{order.id.split('-')[0]}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600 }}>{order.supplierName}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Badge color={getStatusColor(order.status)}>{order.status}</Badge>
            {order.expectedDeliveryDate && <p style={{ margin: '8px 0 0', fontSize: '12px' }}>Entrega: {new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>}
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} /> Detalle de Ítems
          </h4>
          
          <Table
            keyField="variantId"
            data={order.lines}
            columns={[
              { key: 'sku', header: 'SKU', render: (l) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.variantSku || l.variantId}</span> },
              { key: 'cost', header: 'Costo U.', render: (l) => <span style={{ color: 'var(--text-muted)' }}>{fmtCurrency(l.unitCost)}</span> },
              { key: 'qty', header: 'Cant. Pedida', render: (l) => <span style={{ fontWeight: 'bold' }}>{l.orderedQuantity}</span> },
              { 
                key: 'receivedTotal', 
                header: 'Ingresado', 
                render: (l) => {
                  const pending = l.orderedQuantity - l.receivedQuantity;
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 'bold', color: l.receivedQuantity >= l.orderedQuantity ? 'var(--green)' : 'var(--text-primary)' }}>{l.receivedQuantity}</span>
                      {pending > 0 && <span style={{ fontSize: '11px', color: 'var(--orange)' }}>Faltan {pending}</span>}
                    </div>
                  );
                }
              },
              { 
                key: 'receiveNow', 
                header: receiving ? 'Recibir Ahora' : '', 
                render: (l) => {
                  if (receiving) {
                    return (
                      <input 
                        type="number" 
                        min="0" 
                        max={l.orderedQuantity - l.receivedQuantity}
                        value={receptionLines[l.variantId] ?? ''} 
                        onChange={e => setReceptionLines({ ...receptionLines, [l.variantId]: Number(e.target.value) })}
                        style={{ width: '80px', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px' }}
                      />
                    );
                  }
                  return null;
                }
              },
              { key: 'subtotal', header: 'Subtotal', render: (l) => <span style={{ fontWeight: 600 }}>{fmtCurrency(l.orderedQuantity * l.unitCost)}</span> }
            ]}
          />
          <div style={{ textAlign: 'right', marginTop: '16px' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Monto Total: </span>
            <span style={{ fontSize: '20px', fontWeight: 900 }}>{fmtCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Actions Contextual to Status */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          
          {order.status === 'DRAFT' && (
            <ActionGuard action="manage" subject="Purchasing">
              <Button variant="primary" onClick={() => issueMutation.mutate()} loading={issueMutation.isPending} icon={<Send size={16} />}>
                Emitir Orden al Proveedor
              </Button>
            </ActionGuard>
          )}

          {(order.status === 'ISSUED' || order.status === 'PARTIALLY_RECEIVED') && !receiving && (
            <ActionGuard action="manage" subject="Purchasing">
              <Button variant="primary" onClick={() => setReceiving(true)} icon={<Truck size={16} />}>
                Registrar Recepción (Ingresar Mercadería)
              </Button>
            </ActionGuard>
          )}

          {(order.status === 'ISSUED' || order.status === 'PARTIALLY_RECEIVED') && receiving && (
            <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setReceiving(false)}>Cancelar</Button>
              <Button variant="primary" onClick={() => receiveMutation.mutate()} loading={receiveMutation.isPending} icon={<CheckCircle size={16} />}>
                Confirmar Remito
              </Button>
            </div>
          )}

          {order.status === 'COMPLETED' && (
            <div style={{ padding: '12px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 'var(--radius)', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight: 600 }}>Orden Cumplida (Mercadería Ingresada y Cuentas a Pagar actualizadas).</span>
            </div>
          )}

          {order.status === 'CANCELLED' && (
            <div style={{ padding: '12px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 'var(--radius)', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={20} />
              <span style={{ fontWeight: 600 }}>Orden Cancelada.</span>
            </div>
          )}

        </div>

      </div>
    </Drawer>
  );
}
