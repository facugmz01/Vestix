import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table } from '@/components/ui';
import { salesApi } from '@/api/sales.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, FileText, ShoppingCart, CreditCard } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatCurrency } from '@/utils/formatCurrency';
import {
  contactMissingMessage,
  resolveManualNotificationRecipient,
} from '@/utils/notificationRecipient';

interface Props {
  open: boolean;
  onClose: () => void;
  saleId: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  QUOTATION: 'Presupuesto',
  QUOTE: 'Presupuesto',
  PENDING_PAYMENT: 'Pago Pendiente',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Completado',
  READY_FOR_PICKUP: 'Listo para Retiro',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple'> = {
  QUOTATION: 'gray',
  QUOTE: 'gray',
  PENDING_PAYMENT: 'yellow',
  CONFIRMED: 'green',
  COMPLETED: 'green',
  READY_FOR_PICKUP: 'purple',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta (Débito/Crédito)',
  BANK_TRANSFER: 'Transferencia',
  CUSTOMER_CREDIT: 'Cuenta Corriente',
  QR_MERCADOPAGO: 'QR MercadoPago',
  MULTIPLE: 'Múltiples medios',
};

function isActiveSale(status: string) {
  return status === 'CONFIRMED' || status === 'COMPLETED';
}

export function SaleDetailDrawer({ open, onClose, saleId }: Props) {
  const queryClient = useQueryClient();

  const { data: sale, isLoading } = useQuery({
    queryKey: queryKeys.sales.detail(saleId || ''),
    queryFn: () => salesApi.getSale(saleId!),
    enabled: open && !!saleId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sales.detail(saleId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.sales.all() });
  };

  const confirmMutation = useMutation({
    mutationFn: () => salesApi.confirmQuotation(saleId!),
    onSuccess: () => {
      toast.success('Presupuesto confirmado y convertido en Venta Real.');
      invalidate();
    },
    onError: (err: any) => toast.error(err.message || 'Error al confirmar'),
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: () => salesApi.confirmPayment(saleId!),
    onSuccess: () => {
      toast.success('Pago validado. La venta fue confirmada y el stock descontado.');
      invalidate();
    },
    onError: (err: any) => toast.error(err.message || 'Error al validar el pago'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => salesApi.cancelSale(saleId!),
    onSuccess: () => {
      toast.success('Documento cancelado exitosamente.');
      invalidate();
    },
    onError: (err: any) => toast.error(err.message || 'Error al cancelar'),
  });

  if (!saleId || isLoading || !sale) {
    return <Drawer open={open} onClose={onClose} title="Cargando..." width="lg"><div /></Drawer>;
  }

  const receiptRecipient = resolveManualNotificationRecipient({
    phone: sale.customer?.phone,
    email: sale.customer?.email,
  });

  const handleSendReceipt = async () => {
    const resolved = resolveManualNotificationRecipient({
      phone: sale.customer?.phone,
      email: sale.customer?.email,
    });

    if (!resolved) {
      toast.error(contactMissingMessage('El cliente'));
      return;
    }

    try {
      const res = await salesApi.sendManualReceipt(sale.id, {
        channel: resolved.channel,
        recipient: resolved.recipient,
      });
      toast.success(`${res.message} (${resolved.label})`);
    } catch {
      toast.error('Error al enviar comprobante');
    }
  };

  const handleCancel = () => {
    const messages: Record<string, string> = {
      QUOTATION: '¿Rechazar este presupuesto?',
      QUOTE: '¿Rechazar este presupuesto?',
      PENDING_PAYMENT: '¿Cancelar esta venta con pago pendiente? Se liberará el stock reservado.',
      CONFIRMED: '¿Anular esta venta confirmada? Se restaurará el stock y se revertirán los movimientos financieros.',
      COMPLETED: '¿Anular esta venta completada? Se restaurará el stock y se revertirán los movimientos financieros.',
    };
    if (!window.confirm(messages[sale.status] || '¿Cancelar este documento?')) return;
    cancelMutation.mutate();
  };

  const isQuotation = sale.status === 'QUOTATION' || sale.status === 'QUOTE';
  const statusLabel = STATUS_LABELS[sale.status] || sale.status;
  const statusColor = STATUS_COLORS[sale.status] || 'gray';
  const anyPending = confirmMutation.isPending || confirmPaymentMutation.isPending || cancelMutation.isPending;

  return (
    <Drawer open={open} onClose={onClose} title="Detalle del Documento Comercial" width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {isQuotation ? 'Presupuesto Nro' : 'Venta Nro'}
            </p>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--blue)' }}>
              {isQuotation ? 'P-' : 'V-'}{sale.id.split('-')[0].toUpperCase()}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Cliente: <strong style={{ color: 'var(--text-primary)' }}>{sale.customerName || 'Consumidor Final'}</strong>
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Badge color={statusColor}>{statusLabel}</Badge>
            <p style={{ margin: '8px 0 0', fontSize: '12px' }}>{new Date(sale.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid-responsive grid-cols-3">
          <div style={{ padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Origen de Venta</span>
            <p style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShoppingCart size={14} /> {sale.source}
            </p>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Condición de Pago</span>
            <p style={{ margin: 0, fontWeight: 600 }}>{PAYMENT_METHOD_NAMES[sale.paymentMethod] || sale.paymentMethod}</p>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monto Final</span>
            <p style={{ margin: 0, fontWeight: 900, color: 'var(--green)', fontSize: '18px' }}>{formatCurrency(sale.grandTotal)}</p>
          </div>
        </div>

        {sale.status === 'PENDING_PAYMENT' && (
          <div style={{ padding: '12px 16px', background: 'var(--yellow-bg, #fef9c3)', color: 'var(--yellow, #ca8a04)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            Esta venta tiene el pago pendiente de validación. Al confirmar el pago se descontará el stock reservado y se registrará en tesorería.
          </div>
        )}

        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} /> Artículos ({sale.lines.length})
          </h4>

          <Table
            keyField="id"
            data={sale.lines}
            columns={[
              {
                key: 'product',
                header: 'Artículo / SKU',
                render: (l) => (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{l.productName || 'Producto Desconocido'}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)' }}>
                      SKU: {l.variantSku || 'N/A'}
                    </span>
                  </div>
                ),
              },
              { key: 'price', header: 'Precio Base', render: (l) => <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(l.basePrice)}</span> },
              { key: 'qty', header: 'Cant.', render: (l) => <span style={{ fontWeight: 'bold' }}>{l.quantity}</span> },
              { key: 'discount', header: 'Desc. L.', render: (l) => l.discountAmount > 0 ? <span style={{ color: 'var(--red)' }}>-{formatCurrency(l.discountAmount)}</span> : '-' },
              { key: 'final', header: 'Subtotal Final', render: (l) => <span style={{ fontWeight: 800 }}>{formatCurrency(l.finalPrice)}</span> },
            ]}
          />

          {sale.cartDiscountTotal > 0 && (
            <div style={{ textAlign: 'right', marginTop: '12px', padding: '12px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: '4px', fontWeight: 600 }}>
              Descuento Global Adicional aplicado al carrito: -{formatCurrency(sale.cartDiscountTotal)}
            </div>
          )}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          {sale.status === 'CANCELLED' && (
            <div style={{ padding: '12px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={20} />
              <span style={{ fontWeight: 600 }}>Documento Anulado.</span>
            </div>
          )}

          {isActiveSale(sale.status) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} />
                <span style={{ fontWeight: 600 }}>Venta Completada. Stock descontado.</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                <ActionGuard action="read" subject="Sales">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Button
                      variant="outline"
                      icon={<FileText size={16} />}
                      onClick={handleSendReceipt}
                      disabled={!receiptRecipient}
                    >
                      Enviar Comprobante
                    </Button>
                    {receiptRecipient ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Se enviará a {receiptRecipient.label}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        El cliente no tiene teléfono ni email cargado.
                      </span>
                    )}
                  </div>
                </ActionGuard>
                <ActionGuard action="update" subject="Sales">
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    loading={cancelMutation.isPending}
                    disabled={anyPending}
                    icon={<XCircle size={16} />}
                  >
                    Anular Venta
                  </Button>
                </ActionGuard>
              </div>
            </div>
          )}

          {isQuotation && (
            <ActionGuard action="manage" subject="Sales">
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                <Button variant="ghost" onClick={handleCancel} loading={cancelMutation.isPending} disabled={anyPending} icon={<XCircle size={16} />}>
                  Rechazar / Cancelar Presupuesto
                </Button>
                <Button variant="primary" onClick={() => confirmMutation.mutate()} loading={confirmMutation.isPending} disabled={anyPending} icon={<CheckCircle size={16} />}>
                  Convertir en Venta Real (Confirmar)
                </Button>
              </div>
            </ActionGuard>
          )}

          {sale.status === 'PENDING_PAYMENT' && (
            <ActionGuard action="update" subject="Sales">
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                <Button variant="ghost" onClick={handleCancel} loading={cancelMutation.isPending} disabled={anyPending} icon={<XCircle size={16} />}>
                  Cancelar Venta
                </Button>
                <Button variant="primary" onClick={() => confirmPaymentMutation.mutate()} loading={confirmPaymentMutation.isPending} disabled={anyPending} icon={<CreditCard size={16} />}>
                  Validar Pago y Confirmar
                </Button>
              </div>
            </ActionGuard>
          )}

          {['READY_FOR_PICKUP', 'DELIVERED'].includes(sale.status) && (
            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600 }}>Estado logístico: {STATUS_LABELS[sale.status]}</span>
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Podés cambiar el estado de entrega desde el listado de ventas.
              </p>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
