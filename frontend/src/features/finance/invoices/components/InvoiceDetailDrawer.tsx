import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download, RefreshCw, XCircle, ShieldCheck, AlertTriangle, Building2 } from 'lucide-react';
import { Drawer, Button, Badge } from '@/components/ui';
import { invoicesApi } from '@/api/invoices.api';
import { queryKeys } from '@/api/queryKeys';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props { open: boolean; onClose: () => void; invoiceId: string | null; }

const INVOICE_TYPE_LABELS: Record<string, string> = {
  FACTURA_A: 'Factura A', FACTURA_B: 'Factura B', FACTURA_C: 'Factura C',
  NOTA_CREDITO_A: 'N/C A', NOTA_CREDITO_B: 'N/C B',
};

export function InvoiceDetailDrawer({ open, onClose, invoiceId }: Props) {
  const queryClient = useQueryClient();
  const { data: invoice, isLoading } = useQuery({
    queryKey: queryKeys.invoices.detail(invoiceId || ''),
    queryFn: () => invoicesApi.getInvoice(invoiceId!),
    enabled: open && !!invoiceId,
  });
  const retryMutation = useMutation({
    mutationFn: () => invoicesApi.retryInvoice(invoiceId!),
    onSuccess: () => { toast.success('Reintento enviado a AFIP'); queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all() }); },
    onError: (err: any) => toast.error(err.message || 'Error al reintentar'),
  });
  const cancelMutation = useMutation({
    mutationFn: () => invoicesApi.cancelInvoice(invoiceId!),
    onSuccess: () => { toast.success('Comprobante anulado'); queryClient.invalidateQueries({ queryKey: queryKeys.invoices.all() }); },
    onError: (err: any) => toast.error(err.message || 'Error al anular'),
  });

  if (!invoiceId || isLoading || !invoice) return <Drawer open={open} onClose={onClose} title="Cargando..." width="md"><div /></Drawer>;

  return (
    <Drawer open={open} onClose={onClose} title="Comprobante Electrónico" width="md">
      <div className={styles.stackMd}>

        <div className={styles.heroCard}>
          <div>
            <div className={styles.heroBadges}>
              <InvoiceStatusBadge status={invoice.status} />
              <Badge color="blue">{INVOICE_TYPE_LABELS[invoice.type] || invoice.type}</Badge>
            </div>
            <p className={styles.heroLabel}>Venta Ref.</p>
            <h3 className={styles.heroTitleNeutral}>{formatSaleId(invoice.saleOrderId)}</h3>
            <p className={styles.heroSubtitle}>{new Date(invoice.createdAt).toLocaleString()}</p>
          </div>
          <div className={styles.heroAside}>
            <p className={styles.heroLabel}>Total</p>
            <span className={styles.heroAmountLg}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {invoice.status === 'ISSUED' && invoice.cae && (
          <div className={styles.caeBox}>
            <ShieldCheck size={24} color="var(--green)" />
            <div className={styles.caeBody}>
              <p className={styles.caeTitle}>CAE Aprobado por AFIP</p>
              <p className={styles.caeCode}>{invoice.cae}</p>
              {invoice.caeDueDate && (
                <p className={styles.caeDue}>
                  Venc.: <strong>{new Date(invoice.caeDueDate).toLocaleDateString()}</strong>
                </p>
              )}
            </div>
            {invoice.pdfUrl && (
              <Button variant="ghost" size="sm" icon={<Download size={16} />} onClick={() => window.open(invoice.pdfUrl!, '_blank')}>PDF</Button>
            )}
          </div>
        )}

        {invoice.status === 'FAILED' && (
          <div className={styles.errorBox}>
            <AlertTriangle size={24} color="var(--red)" />
            <div>
              <p className={styles.errorTitle}>Error AFIP</p>
              {invoice.afipCode && <p className={styles.errorCode}>Cód: {invoice.afipCode}</p>}
              <p className={styles.errorMessage}>{invoice.afipMessage || 'Sin detalle disponible.'}</p>
            </div>
          </div>
        )}

        <div className={styles.fiscalPanel}>
          <div className={styles.fiscalPanelHeader}>
            <Building2 size={14} /> Datos Fiscales del Receptor
          </div>
          <div className={styles.fiscalGrid}>
            <div>
              <p className={styles.fiscalFieldLabel}>Razón Social</p>
              <p className={styles.fiscalFieldValue}>{invoice.receiverName}</p>
            </div>
            <div>
              <p className={styles.fiscalFieldLabel}>Documento</p>
              <p className={styles.fiscalFieldValue}>
                {invoice.receiverDocType}: <span className={styles.mono}>{invoice.receiverDocNumber}</span>
              </p>
            </div>
            <div>
              <p className={styles.fiscalFieldLabel}>Condición IVA</p>
              <p className={styles.fiscalFieldValue}>{invoice.receiverIvaCondition}</p>
            </div>
          </div>
        </div>

        <div className={styles.totalsPanel}>
          <div className={styles.totalsRow}>
            <span>Neto Gravado</span>
            <span className={styles.infoValue}>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className={styles.totalsRow}>
            <span>IVA 21%</span>
            <span className={styles.infoValue}>{formatCurrency(invoice.vatAmount)}</span>
          </div>
          <div className={styles.totalsRowFinal}>
            <span className={styles.totalsFinalLabel}>Total</span>
            <span className={styles.totalsFinalValue}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.actionFooter}>
            {invoice.status === 'FAILED' && (
              <ActionGuard action="manage" subject="Finance">
                <Button variant="primary" icon={<RefreshCw size={16} />} onClick={() => retryMutation.mutate()} loading={retryMutation.isPending}>Reintentar Emisión</Button>
              </ActionGuard>
            )}
            {invoice.status === 'ISSUED' && (
              <ActionGuard action="manage" subject="Finance">
                <Button variant="ghost" className={styles.btnDangerGhost} icon={<XCircle size={16} />} onClick={() => cancelMutation.mutate()} loading={cancelMutation.isPending}>Anular</Button>
              </ActionGuard>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
