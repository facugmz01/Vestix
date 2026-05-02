import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input, Table, Badge } from '@/components/ui';
import { salesApi } from '@/api/sales.api';
import { returnsApi, type CreateReturnItemDto, type CreateReturnDto } from '@/api/returns.api';
import { queryKeys } from '@/api/queryKeys';
import type { SaleOrder, ReturnAction, ItemCondition } from '@/types';
import toast from 'react-hot-toast';
import { Search, ShoppingCart, Repeat, AlertTriangle, ArrowRightLeft } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ReturnFormDrawer({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const [saleSearchId, setSaleSearchId] = useState('');
  const [saleOrder, setSaleOrder] = useState<SaleOrder | null>(null);

  const [returnItems, setReturnItems] = useState<Record<string, { qty: number, condition: ItemCondition, reason: string }>>({});
  const [action, setAction] = useState<ReturnAction>('REFUND');

  const searchSale = async () => {
    if (!saleSearchId.trim()) return;
    try {
      const data = await salesApi.getSale(saleSearchId.trim());
      if (data.status !== 'CONFIRMED') {
        toast.error(`El ticket ${data.id} no es una venta confirmada (Estado: ${data.status}).`);
        return;
      }
      setSaleOrder(data);
      // Initialize items with 0 qty
      const initial = data.lines.reduce((acc, line) => ({ 
        ...acc, 
        [line.id]: { qty: 0, condition: 'SELLABLE', reason: '' } 
      }), {});
      setReturnItems(initial as any);
    } catch (err: any) {
      toast.error('Venta no encontrada o error de conexión');
    }
  };

  useEffect(() => {
    if (!open) {
      setSaleSearchId('');
      setSaleOrder(null);
      setReturnItems({});
      setAction('REFUND');
    }
  }, [open]);

  const updateItem = (lineId: string, field: string, value: any) => {
    setReturnItems(prev => ({
      ...prev,
      [lineId]: { ...prev[lineId], [field]: value }
    }));
  };

  const mutation = useMutation({
    mutationFn: (data: CreateReturnDto) => returnsApi.createReturn(data),
    onSuccess: () => {
      toast.success(action === 'EXCHANGE' ? 'Solicitud de Cambio generada (PENDING)' : 'Devolución generada (PENDING)');
      queryClient.invalidateQueries({ queryKey: queryKeys.returns.all() });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Error al crear solicitud'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleOrder) return;

    const payloadItems: CreateReturnItemDto[] = Object.entries(returnItems)
      .filter(([_, data]) => data.qty > 0)
      .map(([lineId, data]) => {
        const line = saleOrder.lines.find(l => l.id === lineId)!;
        return {
          orderLineId: lineId,
          variantId: line.variantId,
          quantity: data.qty,
          condition: data.condition,
          reason: data.reason || 'Sin especificar'
        };
      });

    if (payloadItems.length === 0) {
      toast.error('Debe indicar al menos un artículo a devolver');
      return;
    }

    mutation.mutate({
      saleOrderId: saleOrder.id,
      branchId: saleOrder.branchId, // Assuming return is on the same branch for simplicity, real life might differ
      action,
      items: payloadItems,
    });
  };

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <Drawer
      open={open}
      title="Nueva Solicitud de Devolución / Cambio"
      onClose={onClose}
      width="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending} disabled={!saleOrder}>
            Generar Solicitud
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {!saleOrder ? (
          <div style={{ padding: '24px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <Search size={32} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ margin: '0 0 8px' }}>Buscar Ticket Original</h4>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>No se pueden realizar devoluciones sin el ticket de venta o número de orden.</p>
            <div style={{ display: 'flex', gap: '8px', maxWidth: '400px', margin: '0 auto' }}>
              <div style={{ flex: 1 }}>
                <Input placeholder="Ej: SL-001..." value={saleSearchId} onChange={e => setSaleSearchId(e.target.value)} />
              </div>
              <Button onClick={searchSale}>Buscar Venta</Button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-muted)' }}>Ticket Localizado</p>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, fontFamily: 'monospace' }}>{saleOrder.id}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600 }}>{saleOrder.customerName || 'Consumidor Final'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge color="gray">{new Date(saleOrder.createdAt).toLocaleDateString()}</Badge>
                <div style={{ marginTop: '8px' }}>
                  <Button variant="outline" size="sm" onClick={() => setSaleOrder(null)}>Cambiar Ticket</Button>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', background: 'var(--blue-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--blue)' }}>
              <h4 style={{ margin: '0 0 12px', color: 'var(--blue)' }}>Acción Requerida</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <Button variant={action === 'REFUND' ? 'primary' : 'outline'} onClick={() => setAction('REFUND')}>Reembolso (Refund)</Button>
                <Button variant={action === 'EXCHANGE' ? 'primary' : 'outline'} onClick={() => setAction('EXCHANGE')} icon={<ArrowRightLeft size={16} />}>Cambio de Producto</Button>
                <Button variant={action === 'STORE_CREDIT' ? 'primary' : 'outline'} onClick={() => setAction('STORE_CREDIT')}>Crédito a Favor</Button>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} /> Artículos del Ticket
              </h4>
              <Table
                keyField="id"
                data={saleOrder.lines}
                columns={[
                  { key: 'sku', header: 'SKU', render: (l) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.variantSku || l.variantId}</span> },
                  { key: 'paid', header: 'Pagado C/U', render: (l) => <span>{fmtCurrency(l.finalPrice / l.quantity)}</span> },
                  { key: 'max', header: 'Max. Devol.', render: (l) => <span style={{ fontWeight: 'bold' }}>{l.quantity}</span> },
                  { 
                    key: 'qty', 
                    header: 'Devuelve', 
                    render: (l) => (
                      <input 
                        type="number" min="0" max={l.quantity}
                        value={returnItems[l.id]?.qty ?? 0} 
                        onChange={e => updateItem(l.id, 'qty', Number(e.target.value))}
                        style={{ width: '60px', padding: '4px', border: '1px solid var(--border)', borderRadius: '4px', textAlign: 'right' }}
                      />
                    )
                  },
                  { 
                    key: 'cond', 
                    header: 'Condición Fís.', 
                    render: (l) => (
                      <select 
                        value={returnItems[l.id]?.condition ?? 'SELLABLE'} 
                        onChange={e => updateItem(l.id, 'condition', e.target.value)}
                        style={{ padding: '4px', border: '1px solid var(--border)', borderRadius: '4px' }}
                      >
                        <option value="SELLABLE">Impecable (Sellable)</option>
                        <option value="DAMAGED">Dañado (Damaged)</option>
                        <option value="DEFECTIVE">Falla Fabr. (Defective)</option>
                      </select>
                    )
                  }
                ]}
              />
            </div>
            
            {Object.values(returnItems).some(i => i.qty > 0) && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'right' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Monto Total Implicado:</span>
                <span style={{ fontSize: '24px', fontWeight: 900, marginLeft: '12px' }}>
                  {fmtCurrency(
                    saleOrder.lines.reduce((acc, line) => acc + ((line.finalPrice / line.quantity) * (returnItems[line.id]?.qty || 0)), 0)
                  )}
                </span>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {action === 'REFUND' ? 'A reembolsar al cliente.' : (action === 'EXCHANGE' ? 'A favor del cliente para nueva compra.' : 'Se sumará a la cuenta corriente.')}
                </p>
              </div>
            )}
          </>
        )}

      </div>
    </Drawer>
  );
}
