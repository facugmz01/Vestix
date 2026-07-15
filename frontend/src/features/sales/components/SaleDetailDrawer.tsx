import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table, Input } from '@/components/ui';
import { salesApi } from '@/api/sales.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, FileText, ShoppingCart, CreditCard, Send, Pencil, Download } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId } from '@/utils/formatId';
import {
  contactMissingMessage,
  normalizePhone,
  resolveEmailRecipient,
  resolveManualNotificationRecipient,
  type NotificationChannel,
  type ResolvedRecipient,
} from '@/utils/notificationRecipient';
import type { OrderLineItem } from '@/types';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  saleId: string | null;
  onEditQuotation?: (saleId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  QUOTATION: 'Presupuesto',
  QUOTE: 'Presupuesto',
  PENDING_PAYMENT: 'Pago Pendiente',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Completado',
  READY_FOR_PICKUP: 'Listo para Retiro',
  SHIPPED: 'En Tránsito',
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
  SHIPPED: 'purple',
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

function canSendReceipt(status: string) {
  return status !== 'CANCELLED';
}

function isQuotationStatus(status: string) {
  return status === 'QUOTATION' || status === 'QUOTE';
}

function lineProductName(l: OrderLineItem) {
  return (
    l.productName ||
    l.historicalName ||
    l.variant?.product?.name ||
    'Producto Desconocido'
  );
}

function lineVariantSku(l: OrderLineItem) {
  return l.variantSku || l.historicalSku || l.variant?.sku || 'N/A';
}

function availableReceiptChannels(contact: {
  phone?: string | null;
  email?: string | null;
}): ResolvedRecipient[] {
  const channels: ResolvedRecipient[] = [];
  const phone = normalizePhone(contact.phone);
  const email = resolveEmailRecipient(contact.email);
  if (phone) {
    channels.push({ channel: 'WHATSAPP', recipient: phone, label: `WhatsApp +${phone}` });
  }
  if (email) {
    channels.push({ channel: 'EMAIL', recipient: email, label: `Email ${email}` });
  }
  return channels;
}

export function SaleDetailDrawer({ open, onClose, saleId, onEditQuotation }: Props) {
  const queryClient = useQueryClient();
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptChannel, setReceiptChannel] = useState<NotificationChannel | null>(null);

  useEffect(() => {
    if (open) {
      setPaymentReference('');
      setReceiptChannel(null);
    }
  }, [saleId, open]);

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
    mutationFn: () => salesApi.confirmPayment(saleId!, {
      paymentReference: paymentReference.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('Pago validado. La venta fue confirmada y el stock descontado.');
      setPaymentReference('');
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

  const sendReceiptMutation = useMutation({
    mutationFn: (payload: { channel: NotificationChannel; recipient: string }) =>
      salesApi.sendManualReceipt(saleId!, payload),
    onSuccess: (res, vars) => {
      const channelLabel = vars.channel === 'EMAIL' ? 'Email' : vars.channel === 'SMS' ? 'SMS' : 'WhatsApp';
      toast.success(`${res.message} (${channelLabel}: ${vars.recipient})`);
    },
    onError: (err: any) => toast.error(err.message || 'Error al enviar comprobante'),
  });

  const exportPdfMutation = useMutation({
    mutationFn: () => salesApi.getReceiptLink(saleId!),
    onSuccess: (res) => {
      if (!res.url) {
        toast.error('No se pudo generar el enlace del PDF');
        return;
      }
      window.open(res.url, '_blank', 'noopener,noreferrer');
    },
    onError: (err: any) => toast.error(err.message || 'Error al exportar PDF'),
  });

  if (!saleId || isLoading || !sale) {
    return <Drawer open={open} onClose={onClose} title="Cargando..." width="lg"><div /></Drawer>;
  }

  const receiptChannels = availableReceiptChannels({
    phone: sale.customer?.phone,
    email: sale.customer?.email,
  });
  const preferredRecipient = resolveManualNotificationRecipient({
    phone: sale.customer?.phone,
    email: sale.customer?.email,
  });
  const selectedChannel =
    receiptChannel && receiptChannels.some((c) => c.channel === receiptChannel)
      ? receiptChannel
      : preferredRecipient?.channel || receiptChannels[0]?.channel || null;
  const selectedRecipient =
    receiptChannels.find((c) => c.channel === selectedChannel) || preferredRecipient || null;

  const handleSendReceipt = () => {
    if (!selectedRecipient) {
      toast.error(contactMissingMessage('El cliente'));
      return;
    }
    sendReceiptMutation.mutate({
      channel: selectedRecipient.channel,
      recipient: selectedRecipient.recipient,
    });
  };

  const handleCancel = () => {
    const messages: Record<string, string> = {
      QUOTATION: '¿Rechazar este presupuesto?',
      QUOTE: '¿Rechazar este presupuesto?',
      PENDING_PAYMENT: '¿Cancelar esta venta con pago pendiente? Se liberará el stock reservado.',
      CONFIRMED: '¿Anular esta venta confirmada? Se restaurará el stock y se revertirán los movimientos financieros.',
      COMPLETED: '¿Anular esta venta completada? Se restaurará el stock y se revertirán los movimientos financieros.',
      READY_FOR_PICKUP: '¿Anular esta venta lista para retiro? Se restaurará el stock y se revertirán los movimientos financieros.',
      DELIVERED: '¿Anular esta venta ya entregada? Se restaurará el stock y se revertirán los movimientos financieros. Esta acción es irreversible desde el punto de vista logístico.',
    };
    if (!window.confirm(messages[sale.status] || '¿Cancelar este documento?')) return;
    cancelMutation.mutate();
  };

  const isQuotation = isQuotationStatus(sale.status);
  const statusLabel = STATUS_LABELS[sale.status] || sale.status;
  const statusColor = STATUS_COLORS[sale.status] || 'gray';
  const anyPending =
    confirmMutation.isPending ||
    confirmPaymentMutation.isPending ||
    cancelMutation.isPending ||
    sendReceiptMutation.isPending ||
    exportPdfMutation.isPending;
  const savedPaymentReference = sale.payments?.find(p => p.referenceId)?.referenceId;
  const showSendReceipt = canSendReceipt(sale.status);
  const sendTitle = isQuotation ? 'Enviar presupuesto' : 'Enviar comprobante';
  const sendButtonLabel = isQuotation ? 'Enviar Presupuesto' : 'Enviar Comprobante';

  const sendReceiptBlock = showSendReceipt ? (
    <ActionGuard action="read" subject="Sales">
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Send size={16} />
          <span className={styles.sectionTitle}>{sendTitle}</span>
        </div>

        <div className={styles.actionRow}>
          <Button
            variant="secondary"
            icon={<Download size={16} />}
            onClick={() => exportPdfMutation.mutate()}
            loading={exportPdfMutation.isPending}
            disabled={anyPending}
          >
            Exportar PDF
          </Button>
        </div>

        {receiptChannels.length > 1 && (
          <div className={styles.channelRow}>
            {receiptChannels.map((channel) => (
              <Button
                key={channel.channel}
                size="sm"
                variant={selectedChannel === channel.channel ? 'primary' : 'outline'}
                onClick={() => setReceiptChannel(channel.channel)}
              >
                {channel.channel === 'EMAIL' ? 'Email' : 'WhatsApp'}
              </Button>
            ))}
          </div>
        )}

        <div className={styles.actionRow}>
          <Button
            variant="primary"
            icon={<Send size={16} />}
            onClick={handleSendReceipt}
            loading={sendReceiptMutation.isPending}
            disabled={!selectedRecipient || anyPending}
          >
            {sendButtonLabel}
          </Button>
          {selectedRecipient ? (
            <span className={styles.hintText}>
              Se enviará por el canal del sistema a {selectedRecipient.label}
            </span>
          ) : (
            <span className={styles.hintText}>
              El cliente no tiene teléfono ni email cargado.
            </span>
          )}
        </div>
      </div>
    </ActionGuard>
  ) : null;

  return (
    <Drawer open={open} onClose={onClose} title="Detalle del Documento Comercial" width="lg">
      <div className={styles.stack}>

        <div className={styles.heroCard}>
          <div>
            <p className={styles.heroLabel}>
              {isQuotation ? 'Presupuesto Nro' : 'Venta Nro'}
            </p>
            <h3 className={styles.heroTitle}>
              {formatSaleId(sale.id, sale.status)}
            </h3>
            <p className={styles.heroSubtitle}>
              Cliente: <strong className={styles.heroSubtitleStrong}>{sale.customerName || sale.customer?.fullName || 'Consumidor Final'}</strong>
            </p>
          </div>
          <div className={styles.heroMeta}>
            <Badge color={statusColor}>{statusLabel}</Badge>
            <p className={styles.heroDate}>{new Date(sale.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid-responsive grid-cols-3">
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Origen de Venta</span>
            <p className={styles.statValueRow}>
              <ShoppingCart size={14} /> {sale.source}
            </p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Condición de Pago</span>
            <p className={styles.statValue}>{PAYMENT_METHOD_NAMES[sale.paymentMethod] || sale.paymentMethod}</p>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Monto Final</span>
            <p className={styles.statValueGreen}>{formatCurrency(sale.grandTotal)}</p>
          </div>
        </div>

        {sendReceiptBlock}

        {sale.status === 'PENDING_PAYMENT' && (
          <div className={styles.fieldStack}>
            <div className={styles.alertYellow}>
              Esta venta tiene el pago pendiente de validación. Al confirmar el pago se descontará el stock reservado y se registrará en tesorería.
            </div>
            <Input
              label="Referencia de pago (opcional)"
              placeholder="Ej: Nº de transferencia, comprobante, cupón..."
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>
        )}

        {savedPaymentReference && sale.status !== 'PENDING_PAYMENT' && (
          <div className={styles.refBox}>
            <span className={styles.refLabel}>Referencia de pago registrada</span>
            <p className={styles.refValue}>{savedPaymentReference}</p>
          </div>
        )}

        <div>
          <h4 className={styles.sectionHeading}>
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
                  <div className={styles.lineCol}>
                    <span className={styles.lineName}>{lineProductName(l)}</span>
                    <span className={styles.lineSku}>
                      SKU: {lineVariantSku(l)}
                    </span>
                  </div>
                ),
              },
              { key: 'price', header: 'Precio Base', render: (l) => <span className={styles.textMuted}>{formatCurrency(l.basePrice)}</span> },
              { key: 'qty', header: 'Cant.', render: (l) => <span className={styles.textBold}>{l.quantity}</span> },
              { key: 'discount', header: 'Desc. L.', render: (l) => l.discountAmount > 0 ? <span className={styles.textRed}>-{formatCurrency(l.discountAmount)}</span> : '-' },
              { key: 'final', header: 'Subtotal Final', render: (l) => <span className={styles.textStrong}>{formatCurrency(l.finalPrice)}</span> },
            ]}
          />

          {sale.cartDiscountTotal > 0 && (
            <div className={styles.discountBanner}>
              Descuento Global Adicional aplicado al carrito: -{formatCurrency(sale.cartDiscountTotal)}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {sale.status === 'CANCELLED' && (
            <div className={styles.alertRed}>
              <XCircle size={20} />
              <span className={styles.alertText}>Documento Anulado.</span>
            </div>
          )}

          {isActiveSale(sale.status) && (
            <div className={styles.statusStack}>
              <div className={styles.alertGreen}>
                <CheckCircle size={20} />
                <span className={styles.alertText}>Venta Completada. Stock descontado.</span>
              </div>
              <div className={styles.actionFooter}>
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
              <div className={styles.actionFooter}>
                <Button variant="ghost" onClick={handleCancel} loading={cancelMutation.isPending} disabled={anyPending} icon={<XCircle size={16} />}>
                  Rechazar / Cancelar Presupuesto
                </Button>
                {onEditQuotation && (
                  <Button
                    variant="secondary"
                    onClick={() => onEditQuotation(sale.id)}
                    disabled={anyPending}
                    icon={<Pencil size={16} />}
                  >
                    Editar Presupuesto
                  </Button>
                )}
                <Button variant="primary" onClick={() => confirmMutation.mutate()} loading={confirmMutation.isPending} disabled={anyPending} icon={<CheckCircle size={16} />}>
                  Convertir en Venta Real (Confirmar)
                </Button>
              </div>
            </ActionGuard>
          )}

          {sale.status === 'PENDING_PAYMENT' && (
            <ActionGuard action="update" subject="Sales">
              <div className={styles.actionFooter}>
                <Button variant="ghost" onClick={handleCancel} loading={cancelMutation.isPending} disabled={anyPending} icon={<XCircle size={16} />}>
                  Cancelar Venta
                </Button>
                <Button variant="primary" onClick={() => confirmPaymentMutation.mutate()} loading={confirmPaymentMutation.isPending} disabled={anyPending} icon={<CreditCard size={16} />}>
                  Validar Pago y Confirmar
                </Button>
              </div>
            </ActionGuard>
          )}

          {['READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED'].includes(sale.status) && (
            <div className={styles.statusStack}>
              <div className={styles.logisticsBox}>
                <span className={styles.logisticsTitle}>Estado logístico: {STATUS_LABELS[sale.status]}</span>
                <p className={styles.logisticsText}>
                  {sale.status === 'SHIPPED' || sale.shippingAddress
                    ? 'Este pedido es envío a domicilio. Completá el seguimiento GPS y la entrega desde Envíos y Despacho.'
                    : 'Podés cambiar el estado de entrega desde el listado de ventas o anular la venta si corresponde.'}
                </p>
                {sale.shippingMethodName && (
                  <p className={styles.logisticsText}>
                    Método: {sale.shippingMethodName}
                    {sale.shippingAddress?.city ? ` · ${sale.shippingAddress.city}` : ''}
                  </p>
                )}
              </div>
              <div className={styles.actionFooter}>
                <ActionGuard action="update" subject="Sales">
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    loading={cancelMutation.isPending}
                    disabled={anyPending || sale.status === 'SHIPPED'}
                    icon={<XCircle size={16} />}
                  >
                    Anular Venta
                  </Button>
                </ActionGuard>
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
