import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table } from '@/components/ui';
import { receiptsApi } from '@/api/receipts.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle, ShieldAlert, Printer } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { BulkPrintLabelsModal } from '@/features/labels/components/BulkPrintLabelsModal';

interface Props {
  open: boolean;
  onClose: () => void;
  receiptId: string | null;
}

export function GoodsReceiptDetailDrawer({ open, onClose, receiptId }: Props) {
  const queryClient = useQueryClient();
  const [printOpen, setPrintOpen] = useState(false);

  const { data: receipt, isLoading } = useQuery({
    queryKey: queryKeys.receipts.detail(receiptId || ''),
    queryFn: () => receiptsApi.getReceipt(receiptId!),
    enabled: open && !!receiptId,
  });

  const validateMutation = useMutation({
    mutationFn: () => receiptsApi.validateReceipt(receiptId!),
    onSuccess: () => {
      toast.success('Remito validado e inventario actualizado.');
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.detail(receiptId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.receipts.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al validar el remito'),
  });

  if (!receiptId || isLoading || !receipt) {
    return <Drawer open={open} onClose={onClose} title="Cargando..." width="lg"><div /></Drawer>;
  }

  const isDisputed = receipt.status === 'DISPUTED';
  const printableLines = receipt.lines.filter((l) => l.receivedQuantity > 0);

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'gray';
      case 'DISPUTED': return 'orange';
      case 'VALIDATED': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Auditoría de Remito" width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-muted)' }}>Remito ID / OC Ref</p>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, fontFamily: 'monospace' }}>{receipt.id.split('-')[0]}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>OC: <span style={{ fontFamily: 'monospace' }}>{receipt.purchaseOrderId.split('-')[0]}</span></p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Badge color={getStatusColor(receipt.status)}>{receipt.status}</Badge>
            <p style={{ margin: '8px 0 0', fontSize: '12px' }}>{new Date(receipt.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {isDisputed && receipt.status !== 'VALIDATED' && (
          <div style={{ padding: '16px', background: 'var(--orange-bg)', color: 'var(--orange)', borderRadius: 'var(--radius)', border: '1px solid var(--orange)' }}>
            <h4 style={{ margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} /> Existen Diferencias
            </h4>
            <p style={{ margin: 0, fontSize: '13px' }}>El conteo físico no coincide con lo esperado según la OC. Requiere autorización gerencial para validar.</p>
          </div>
        )}

        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Resultados del Conteo
          </h4>
          
          <Table
            keyField="id"
            data={receipt.lines}
            columns={[
              { key: 'sku', header: 'SKU', render: (l) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{l.variantSku || l.variantId}</span> },
              { key: 'expected', header: 'Esperado (OC)', render: (l) => <span style={{ color: 'var(--text-muted)' }}>{l.expectedQuantity}</span> },
              { key: 'received', header: 'Ingresado Real', render: (l) => <span style={{ fontWeight: 'bold' }}>{l.receivedQuantity}</span> },
              { 
                key: 'diff', 
                header: 'Diferencia', 
                render: (l) => {
                  if (l.difference === 0) return <CheckCircle size={16} color="var(--green)" />;
                  return (
                    <Badge color={l.difference > 0 ? 'orange' : 'red'}>
                      {l.difference > 0 ? `+${l.difference} Sobrante` : `${l.difference} Faltante`}
                    </Badge>
                  );
                }
              }
            ]}
          />
        </div>

        {/* Actions */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {(receipt.status === 'DRAFT' || receipt.status === 'DISPUTED') && (
            <ActionGuard action="manage" subject="Purchasing">
              <Button 
                variant={isDisputed ? 'outline' : 'primary'} 
                onClick={() => validateMutation.mutate()} 
                loading={validateMutation.isPending} 
                icon={isDisputed ? <ShieldAlert size={16} color="var(--orange)" /> : <CheckCircle size={16} />}
              >
                {isDisputed ? 'Forzar Validación Mánager' : 'Validar Remito e Ingresar Stock'}
              </Button>
            </ActionGuard>
          )}

          {receipt.status === 'VALIDATED' && (
            <>
              {printableLines.length > 0 && (
                <ActionGuard action="print" subject="Labels">
                  <Button variant="secondary" icon={<Printer size={16} />} onClick={() => setPrintOpen(true)}>
                    Imprimir etiquetas ({printableLines.reduce((s, l) => s + l.receivedQuantity, 0)})
                  </Button>
                </ActionGuard>
              )}
              <div style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginLeft: 'auto' }}>
                <CheckCircle size={20} /> Remito impactado en inventario exitosamente.
              </div>
            </>
          )}

        </div>

      </div>

      <BulkPrintLabelsModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        items={printableLines.map((l) => ({
          variantId: l.variantId,
          sku: l.variantSku,
          productName: l.productName,
          quantity: l.receivedQuantity,
        }))}
        title="Etiquetas de recepción"
      />
    </Drawer>
  );
}
