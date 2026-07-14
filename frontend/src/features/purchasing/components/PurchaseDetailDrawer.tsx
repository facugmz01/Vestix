import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table } from '@/components/ui';
import { purchasesApi } from '@/api/purchases.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Truck, CheckCircle, Package, XCircle, Send, Wallet } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatEntityId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';
import { PurchasePaymentDrawer, type PurchasePaymentPayload } from './PurchasePaymentDrawer';

interface Props {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
}

export function PurchaseDetailDrawer({ open, onClose, orderId }: Props) {
  const queryClient = useQueryClient();

  const [receiving, setReceiving] = useState(false);
  const [receptionLines, setReceptionLines] = useState<Record<string, number>>({});
  const [issuePaymentOpen, setIssuePaymentOpen] = useState(false);
  const [registerPaymentOpen, setRegisterPaymentOpen] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: queryKeys.purchases.detail(orderId || ''),
    queryFn: () => purchasesApi.getOrder(orderId!),
    enabled: open && !!orderId,
  });

  useEffect(() => {
    if (order && (order.status === 'ISSUED' || order.status === 'PARTIALLY_RECEIVED') && !receiving) {
      const initial = order.lines.reduce((acc, line) => ({
        ...acc,
        [line.variantId]: Math.max(0, line.orderedQuantity - line.receivedQuantity)
      }), {});
      setReceptionLines(initial);
    }
  }, [order, receiving]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.purchases.detail(orderId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() });
  };

  const issueMutation = useMutation({
    mutationFn: (payload: PurchasePaymentPayload) => purchasesApi.issueOrder(orderId!, {
      paymentAccountId: payload.paymentAccountId,
      paymentAmount: payload.paymentAmount,
      paymentReference: payload.paymentReference,
      notes: payload.notes,
    }),
    onSuccess: () => {
      toast.success('Orden emitida e impacto financiero registrado');
      invalidate();
      setIssuePaymentOpen(false);
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al emitir orden'),
  });

  const paymentMutation = useMutation({
    mutationFn: (payload: PurchasePaymentPayload) => purchasesApi.registerPayment(orderId!, {
      paymentAccountId: payload.paymentAccountId!,
      amount: payload.paymentAmount,
      paymentReference: payload.paymentReference,
      notes: payload.notes,
    }),
    onSuccess: () => {
      toast.success('Pago registrado');
      invalidate();
      setRegisterPaymentOpen(false);
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al registrar el pago'),
  });

  const receiveMutation = useMutation({
    mutationFn: () => {
      const lines = Object.entries(receptionLines).map(([variantId, qty]) => ({ variantId, receivedQuantity: qty }));
      return purchasesApi.receiveOrder(orderId!, { lines });
    },
    onSuccess: () => {
      toast.success('Recepción registrada');
      invalidate();
      setReceiving(false);
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error en la recepción'),
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

  const paidAmount = order.paidAmount || 0;
  const outstanding = Math.max(0, order.totalAmount - paidAmount);
  const supplierName = order.supplierName || (order as any).supplier?.companyName;

  return (
    <>
      <Drawer open={open} onClose={onClose} title="Orden de Compra" width="lg">
        <div className={styles.stack}>

          <div className={styles.heroCard}>
            <div>
              <p className={styles.heroLabel}>OC ID</p>
              <h3 className={styles.heroTitleNeutral}>{formatEntityId(order.id, 'OC-')}</h3>
              <p className={styles.statValue}>{supplierName}</p>
            </div>
            <div className={styles.heroMeta}>
              <Badge color={getStatusColor(order.status)}>{order.status}</Badge>
              {order.expectedDeliveryDate && (
                <p className={styles.heroDate}>Entrega: {new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <div className={styles.financeSummary}>
            <div>
              <p className={styles.heroLabel}>Total</p>
              <p className={styles.infoValue}>{formatCurrency(order.totalAmount)}</p>
            </div>
            <div>
              <p className={styles.heroLabel}>Pagado</p>
              <p className={styles.infoValue}>{formatCurrency(paidAmount)}</p>
            </div>
            <div>
              <p className={styles.heroLabel}>Saldo / deuda</p>
              <p className={outstanding > 0 ? styles.textOrange : styles.textBoldGreen}>
                {formatCurrency(outstanding)}
              </p>
            </div>
            {(order.discountAmount || 0) > 0 && (
              <div>
                <p className={styles.heroLabel}>Descuento</p>
                <p className={styles.infoValue}>- {formatCurrency(order.discountAmount!)}</p>
              </div>
            )}
            {(order.shippingCost || 0) > 0 && (
              <div>
                <p className={styles.heroLabel}>Envío</p>
                <p className={styles.infoValue}>{formatCurrency(order.shippingCost!)}</p>
              </div>
            )}
          </div>

          <div>
            <h4 className={styles.sectionHeading}>
              <Package size={18} /> Detalle de Ítems
            </h4>

            <Table
              keyField="variantId"
              data={order.lines}
              columns={[
                {
                  key: 'sku',
                  header: 'SKU',
                  render: (l) => (
                    <span className={styles.monoBold}>
                      {l.variantSku || l.productName || l.variantId}
                    </span>
                  ),
                },
                { key: 'cost', header: 'Costo U.', render: (l) => <span className={styles.textMuted}>{formatCurrency(l.unitCost)}</span> },
                { key: 'qty', header: 'Cant. Pedida', render: (l) => <span className={styles.textBold}>{l.orderedQuantity}</span> },
                {
                  key: 'receivedTotal',
                  header: 'Ingresado',
                  render: (l) => {
                    const pending = l.orderedQuantity - l.receivedQuantity;
                    return (
                      <div className={styles.lineCol}>
                        <span className={l.receivedQuantity >= l.orderedQuantity ? styles.textBoldGreen : styles.textBoldPrimary}>
                          {l.receivedQuantity}
                        </span>
                        {pending > 0 && <span className={styles.textOrange}>Faltan {pending}</span>}
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
                          className={styles.qtyInput}
                        />
                      );
                    }
                    return null;
                  }
                },
                {
                  key: 'subtotal',
                  header: 'Subtotal',
                  render: (l) => (
                    <span className={styles.infoValue}>
                      {formatCurrency(Math.max(0, l.orderedQuantity * l.unitCost - (l.discountAmount || 0)))}
                    </span>
                  ),
                },
              ]}
            />
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Monto Total: </span>
              <span className={styles.totalValue}>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className={styles.footerBetween}>

            {order.status === 'DRAFT' && (
              <ActionGuard action="manage" subject="Purchasing">
                <Button variant="primary" onClick={() => setIssuePaymentOpen(true)} icon={<Send size={16} />}>
                  Emitir Orden (pago / deuda)
                </Button>
              </ActionGuard>
            )}

            {order.status !== 'DRAFT' && order.status !== 'CANCELLED' && outstanding > 0 && (
              <ActionGuard action="manage" subject="Purchasing">
                <Button variant="secondary" onClick={() => setRegisterPaymentOpen(true)} icon={<Wallet size={16} />}>
                  Registrar pago
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
              <div className={styles.actionFooterFull}>
                <Button variant="ghost" onClick={() => setReceiving(false)}>Cancelar</Button>
                <Button variant="primary" onClick={() => receiveMutation.mutate()} loading={receiveMutation.isPending} icon={<CheckCircle size={16} />}>
                  Confirmar Remito
                </Button>
              </div>
            )}

            {order.status === 'COMPLETED' && (
              <div className={styles.alertGreenFull}>
                <CheckCircle size={20} />
                <span className={styles.alertText}>
                  Orden cumplida.
                  {outstanding > 0
                    ? ` Queda un saldo pendiente de ${formatCurrency(outstanding)}.`
                    : ' Pagada en su totalidad.'}
                </span>
              </div>
            )}

            {order.status === 'CANCELLED' && (
              <div className={styles.alertRedFull}>
                <XCircle size={20} />
                <span className={styles.alertText}>Orden Cancelada.</span>
              </div>
            )}

          </div>

        </div>
      </Drawer>

      <PurchasePaymentDrawer
        open={issuePaymentOpen}
        onClose={() => setIssuePaymentOpen(false)}
        title="Emitir orden y definir pago"
        totalAmount={order.totalAmount}
        loading={issueMutation.isPending}
        confirmLabel="Emitir orden"
        onConfirm={(payload) => issueMutation.mutate(payload)}
      />

      <PurchasePaymentDrawer
        open={registerPaymentOpen}
        onClose={() => setRegisterPaymentOpen(false)}
        title="Registrar pago a proveedor"
        totalAmount={order.totalAmount}
        maxAmount={outstanding}
        requirePayment
        loading={paymentMutation.isPending}
        confirmLabel="Registrar pago"
        onConfirm={(payload) => paymentMutation.mutate(payload)}
      />
    </>
  );
}
