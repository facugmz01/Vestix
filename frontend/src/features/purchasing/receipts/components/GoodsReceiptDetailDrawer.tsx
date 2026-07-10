import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table } from '@/components/ui';
import { receiptsApi } from '@/api/receipts.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle, ShieldAlert, Printer } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { BulkPrintLabelsModal } from '@/features/labels/components/BulkPrintLabelsModal';
import { useAuthStore } from '@/store/auth.store';
import { formatEntityId, formatShortId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';


interface Props {
  open: boolean;
  onClose: () => void;
  receiptId: string | null;
}

export function GoodsReceiptDetailDrawer({ open, onClose, receiptId }: Props) {
  const queryClient = useQueryClient();
  const [printOpen, setPrintOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data: receipt, isLoading } = useQuery({
    queryKey: queryKeys.receipts.detail(receiptId || ''),
    queryFn: () => receiptsApi.getReceipt(receiptId!),
    enabled: open && !!receiptId,
  });

  const validateMutation = useMutation({
    mutationFn: () => receiptsApi.validateReceipt(receiptId!, {
      branchId: user?.branchId,
      approvedByUserId: user?.id,
    }),
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
      <div className={styles.stack}>
        
        <div className={styles.heroCard}>
          <div>
            <p className={styles.heroLabel}>Remito ID / OC Ref</p>
            <h3 className={styles.heroTitle}>{formatShortId(receipt.id)}</h3>
            <p className={styles.heroSubtitle}>OC: <span className={styles.mono}>{formatEntityId(receipt.purchaseOrderId, 'OC-')}</span></p>
          </div>
          <div className={styles.heroMeta}>
            <Badge color={getStatusColor(receipt.status)}>{receipt.status}</Badge>
            <p className={styles.heroDateSm}>{new Date(receipt.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {isDisputed && receipt.status !== 'VALIDATED' && (
          <div className={styles.warningPanelOrange}>
            <h4 className={styles.warningPanelOrangeTitle}>
              <AlertTriangle size={20} /> Existen Diferencias
            </h4>
            <p className={styles.warningPanelText}>El conteo físico no coincide con lo esperado según la OC. Requiere autorización gerencial para validar.</p>
          </div>
        )}

        <div>
          <h4 className={styles.sectionHeading}>
            Resultados del Conteo
          </h4>
          
          <Table
            keyField="id"
            data={receipt.lines}
            columns={[
              { key: 'sku', header: 'SKU', render: (l) => <span className={styles.monoBold}>{l.variantSku || l.variantId}</span> },
              { key: 'expected', header: 'Esperado (OC)', render: (l) => <span className={styles.textMuted}>{l.expectedQuantity}</span> },
              { key: 'received', header: 'Ingresado Real', render: (l) => <span className={styles.textBold}>{l.receivedQuantity}</span> },
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
        <div className={styles.footerBetween}>
          
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
              <div className={styles.successInline}>
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
