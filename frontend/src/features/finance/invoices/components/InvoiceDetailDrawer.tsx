import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download, RefreshCw, XCircle, ShieldCheck, AlertTriangle, Building2 } from 'lucide-react';
import { Drawer, Button, Badge } from '@/components/ui';
import { invoicesApi } from '@/api/invoices.api';
import { queryKeys } from '@/api/queryKeys';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { ActionGuard } from '@/rbac/ActionGuard';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatSaleId, formatShortId } from '@/utils/formatId';

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>

        <div style={{ padding: '20px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <InvoiceStatusBadge status={invoice.status} />
              <Badge color="blue">{INVOICE_TYPE_LABELS[invoice.type] || invoice.type}</Badge>
            </div>
            <p style={{ margin: '0 0 2px', fontSize: '13px', color: 'var(--text-muted)' }}>Venta Ref.</p>
            <h3 style={{ margin: 0, fontFamily: 'monospace', fontWeight: 800, fontSize: '18px' }}>{formatSaleId(invoice.saleOrderId)}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(invoice.createdAt).toLocaleString()}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-muted)' }}>Total</p>
            <span style={{ fontSize: '28px', fontWeight: 900 }}>{formatCurrency(invoice.total)}</span>
          </div>
        </div>

        {invoice.status === 'ISSUED' && invoice.cae && (
          <div style={{ padding: '16px', background: 'var(--green-bg)', borderRadius: '10px', border: '1px solid var(--green)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <ShieldCheck size={24} color="var(--green)" />
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--green)' }}>CAE Aprobado por AFIP</p>
              <p style={{ margin: '0 0 8px', fontFamily: 'monospace', fontSize: '16px', fontWeight: 900 }}>{invoice.cae}</p>
              {invoice.caeDueDate && <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Venc.: <strong>{new Date(invoice.caeDueDate).toLocaleDateString()}</strong></p>}
            </div>
            {invoice.pdfUrl && (
              <Button variant="ghost" size="sm" icon={<Download size={16} />} onClick={() => window.open(invoice.pdfUrl!, '_blank')}>PDF</Button>
            )}
          </div>
        )}

        {invoice.status === 'FAILED' && (
          <div style={{ padding: '16px', background: 'var(--red-bg)', borderRadius: '10px', border: '1px solid var(--red)', display: 'flex', gap: '12px' }}>
            <AlertTriangle size={24} color="var(--red)" />
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--red)' }}>Error AFIP</p>
              {invoice.afipCode && <p style={{ margin: '0 0 2px', fontSize: '12px', fontFamily: 'monospace' }}>Cód: {invoice.afipCode}</p>}
              <p style={{ margin: 0, fontSize: '13px' }}>{invoice.afipMessage || 'Sin detalle disponible.'}</p>
            </div>
          </div>
        )}

        <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={14} /> Datos Fiscales del Receptor
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            <div><p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Razón Social</p><p style={{ margin: 0, fontWeight: 700 }}>{invoice.receiverName}</p></div>
            <div><p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Documento</p><p style={{ margin: 0, fontWeight: 700 }}>{invoice.receiverDocType}: <span style={{ fontFamily: 'monospace' }}>{invoice.receiverDocNumber}</span></p></div>
            <div><p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Condición IVA</p><p style={{ margin: 0 }}>{invoice.receiverIvaCondition}</p></div>
          </div>
        </div>

        <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}><span>Neto Gravado</span><span style={{ fontWeight: 600 }}>{formatCurrency(invoice.subtotal)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}><span>IVA 21%</span><span style={{ fontWeight: 600 }}>{formatCurrency(invoice.vatAmount)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '2px solid var(--border)' }}><span style={{ fontWeight: 800, fontSize: '16px' }}>Total</span><span style={{ fontWeight: 900, fontSize: '20px' }}>{formatCurrency(invoice.total)}</span></div>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {invoice.status === 'FAILED' && (
            <ActionGuard action="manage" subject="Finance">
              <Button variant="primary" icon={<RefreshCw size={16} />} onClick={() => retryMutation.mutate()} loading={retryMutation.isPending}>Reintentar Emisión</Button>
            </ActionGuard>
          )}
          {invoice.status === 'ISSUED' && (
            <ActionGuard action="manage" subject="Finance">
              <Button variant="ghost" style={{ color: 'var(--red)' }} icon={<XCircle size={16} />} onClick={() => cancelMutation.mutate()} loading={cancelMutation.isPending}>Anular</Button>
            </ActionGuard>
          )}
        </div>
      </div>
    </Drawer>
  );
}
