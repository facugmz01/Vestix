import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table } from '@/components/ui';
import { salesApi } from '@/api/sales.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, FileText, ShoppingCart } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';

interface Props {
  open: boolean;
  onClose: () => void;
  saleId: string | null;
}

export function SaleDetailDrawer({ open, onClose, saleId }: Props) {
  const queryClient = useQueryClient();

  const { data: sale, isLoading } = useQuery({
    queryKey: queryKeys.sales.detail(saleId || ''),
    queryFn: () => salesApi.getSale(saleId!),
    enabled: open && !!saleId,
  });

  const confirmMutation = useMutation({
    mutationFn: () => salesApi.confirmQuotation(saleId!),
    onSuccess: () => {
      toast.success('Presupuesto confirmado y convertido en Venta Real.');
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.detail(saleId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al confirmar'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => salesApi.cancelSale(saleId!),
    onSuccess: () => {
      toast.success('Documento cancelado exitosamente.');
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.detail(saleId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al cancelar'),
  });

  if (!saleId || isLoading || !sale) {
    return <Drawer open={open} onClose={onClose} title="Cargando..." width="lg"><div /></Drawer>;
  }

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const paymentMethodNames: Record<string, string> = {
    CASH: 'Efectivo',
    CREDIT_CARD: 'Tarjeta (Débito/Crédito)',
    BANK_TRANSFER: 'Transferencia',
    CUSTOMER_CREDIT: 'Cuenta Corriente',
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'QUOTATION': return 'gray';
      case 'CONFIRMED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Detalle del Documento Comercial" width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-muted)' }}>{sale.status === 'QUOTATION' ? 'Presupuesto Nro' : 'Venta Nro'}</p>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--blue)' }}>
              {sale.status === 'QUOTATION' ? 'P-' : 'V-'}{sale.id.split('-')[0].toUpperCase()}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Cliente: <strong style={{ color: 'var(--text-primary)' }}>{sale.customerName || 'Consumidor Final'}</strong></p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Badge color={getStatusColor(sale.status)}>{sale.status}</Badge>
            <p style={{ margin: '8px 0 0', fontSize: '12px' }}>{new Date(sale.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid-responsive grid-cols-3">
          <div style={{ padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Origen de Venta</span>
            <p style={{ margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><ShoppingCart size={14} /> {sale.source}</p>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Condición de Pago</span>
            <p style={{ margin: 0, fontWeight: 600 }}>{paymentMethodNames[sale.paymentMethod] || sale.paymentMethod}</p>
          </div>
          <div style={{ padding: '12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Monto Final</span>
            <p style={{ margin: 0, fontWeight: 900, color: 'var(--green)', fontSize: '18px' }}>{fmtCurrency(sale.grandTotal)}</p>
          </div>
        </div>

        {/* Lines */}
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
                ) 
              },
              { key: 'price', header: 'Precio Base', render: (l) => <span style={{ color: 'var(--text-muted)' }}>{fmtCurrency(l.basePrice)}</span> },
              { key: 'qty', header: 'Cant.', render: (l) => <span style={{ fontWeight: 'bold' }}>{l.quantity}</span> },
              { key: 'discount', header: 'Desc. L.', render: (l) => l.discountAmount > 0 ? <span style={{ color: 'var(--red)' }}>-{fmtCurrency(l.discountAmount)}</span> : '-' },
              { key: 'final', header: 'Subtotal Final', render: (l) => <span style={{ fontWeight: 800 }}>{fmtCurrency(l.finalPrice)}</span> }
            ]}
          />
          
          {sale.cartDiscountTotal > 0 && (
            <div style={{ textAlign: 'right', marginTop: '12px', padding: '12px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: '4px', fontWeight: 600 }}>
              Descuento Global Adicional aplicado al carrito: -{fmtCurrency(sale.cartDiscountTotal)}
            </div>
          )}
        </div>

        {/* Actions Contextual to Status */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          
          {sale.status === 'QUOTATION' && (
            <ActionGuard action="manage" subject="Sales">
              <Button variant="ghost" onClick={() => cancelMutation.mutate()} loading={cancelMutation.isPending} disabled={confirmMutation.isPending}>
                Rechazar / Cancelar Presupuesto
              </Button>
              <Button variant="primary" onClick={() => confirmMutation.mutate()} loading={confirmMutation.isPending} disabled={cancelMutation.isPending} icon={<CheckCircle size={16} />}>
                Convertir en Venta Real (Confirmar)
              </Button>
            </ActionGuard>
          )}

          {sale.status === 'CONFIRMED' && (
            <div style={{ padding: '12px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 'var(--radius)', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight: 600 }}>Venta Completada. Stock descontado.</span>
            </div>
          )}

          {sale.status === 'CANCELLED' && (
            <div style={{ padding: '12px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 'var(--radius)', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={20} />
              <span style={{ fontWeight: 600 }}>Documento Anulado.</span>
            </div>
          )}

        </div>

      </div>
    </Drawer>
  );
}
