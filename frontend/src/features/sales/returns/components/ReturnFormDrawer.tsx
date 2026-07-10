import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input, Table, Badge } from '@/components/ui';
import { salesApi } from '@/api/sales.api';
import { returnsApi, type CreateReturnItemDto, type CreateReturnDto } from '@/api/returns.api';
import { queryKeys } from '@/api/queryKeys';
import type { SaleOrder, ReturnAction, ItemCondition } from '@/types';
import toast from 'react-hot-toast';
import { Search, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId, formatShortId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';


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
      
      if (!data) {
        toast.error('Ticket no encontrado. Verifique el código.');
        return;
      }

      if (data.status !== 'CONFIRMED') {
        toast.error(`El ticket ${formatSaleId(data.id, data.status)} no es una venta confirmada (Estado: ${data.status}).`);
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
      <div className={styles.formStackMd}>
        
        {!saleOrder ? (
          <div className={styles.searchPanel}>
            <Search size={32} className={styles.searchPanelIcon} />
            <h4 className={styles.searchPanelTitle}>Buscar Ticket Original</h4>
            <p className={styles.searchPanelText}>No se pueden realizar devoluciones sin el ticket de venta o número de orden.</p>
            <div className={styles.searchPanelRow}>
              <div className={styles.flex1}>
                <Input placeholder="Ej: SL-001..." value={saleSearchId} onChange={e => setSaleSearchId(e.target.value)} />
              </div>
              <Button onClick={searchSale}>Buscar Venta</Button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.saleLocatedCard}>
              <div>
                <p className={styles.heroLabel}>Ticket Localizado</p>
                <h3 className={styles.heroTitleAccent}>
                  {formatSaleId(saleOrder.id, saleOrder.status)}
                </h3>
                <p className={styles.customerName}>{saleOrder.customerName || 'Consumidor Final'}</p>
              </div>
              <div className={styles.openingAside}>
                <Badge color="gray">{new Date(saleOrder.createdAt).toLocaleDateString()}</Badge>
                <div className={styles.balanceAction}>
                  <Button variant="secondary" size="sm" onClick={() => setSaleOrder(null)}>Cambiar Ticket</Button>
                </div>
              </div>
            </div>

            <div className={styles.actionPanelBlue}>
              <h4 className={styles.actionPanelBlueTitle}>Acción Requerida</h4>
              <div className={`grid-responsive grid-cols-3 ${styles.actionGrid}`}>
                <Button variant={action === 'REFUND' ? 'primary' : 'secondary'} onClick={() => setAction('REFUND')}>Reembolso (Refund)</Button>
                <Button variant={action === 'EXCHANGE' ? 'primary' : 'secondary'} onClick={() => setAction('EXCHANGE')} icon={<ArrowRightLeft size={16} />}>Cambio de Producto</Button>
                <Button variant={action === 'STORE_CREDIT' ? 'primary' : 'secondary'} onClick={() => setAction('STORE_CREDIT')}>Crédito a Favor</Button>
              </div>
            </div>

            <div>
              <h4 className={styles.sectionTitleRow}>
                <ShoppingCart size={18} /> Artículos del Ticket
              </h4>
              <Table
                keyField="id"
                data={saleOrder.lines}
                columns={[
                  { 
                    key: 'sku', 
                    header: 'Artículo / SKU', 
                    render: (l) => (
                      <div className={styles.lineCol}>
                        <span className={styles.lineName}>{l.productName || 'Producto'}</span>
                        <span className={styles.lineSku}>
                          {l.variantSku || l.variantId.split('-')[0]}
                        </span>
                      </div>
                    )
                  },
                  { 
                    key: 'paid', 
                    header: 'Pagado C/U', 
                    render: (l) => {
                      const unitPrice = l.finalPrice > 0 ? (l.finalPrice / l.quantity) : l.basePrice;
                      return <span>{formatCurrency(unitPrice)}</span>;
                    } 
                  },
                  { key: 'max', header: 'Max. Devol.', render: (l) => <span className={styles.textBold}>{l.quantity}</span> },
                  { 
                    key: 'qty', 
                    header: 'Devuelve', 
                    render: (l) => (
                      <input 
                        type="number" min="0" max={l.quantity}
                        value={returnItems[l.id]?.qty ?? 0} 
                        onChange={e => updateItem(l.id, 'qty', Number(e.target.value))}
                        className={styles.qtyInputNarrow}
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
                        className={styles.selectCompact}
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
              <div className={styles.returnTotalPanel}>
                <span className={styles.returnTotalLabel}>Monto Total Implicado:</span>
                <span className={styles.returnTotalValue}>
                  {formatCurrency(
                    saleOrder.lines.reduce((acc, line) => {
                      const unitPrice = line.finalPrice > 0 ? (line.finalPrice / line.quantity) : line.basePrice;
                      return acc + (unitPrice * (returnItems[line.id]?.qty || 0));
                    }, 0)
                  )}
                </span>
                <p className={styles.hintSm}>
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
