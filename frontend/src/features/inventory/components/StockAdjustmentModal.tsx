import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { inventoryApi, type AdjustStockDto, type EnrichedStockLevel } from '@/api/inventory.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { ArrowRightLeft } from 'lucide-react';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  stockNode: EnrichedStockLevel | null;
}

export function StockAdjustmentModal({ open, onClose, stockNode }: Props) {
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState<number>(0);
  const [type, setType] = useState<AdjustStockDto['type']>('ADD');
  const [reason, setReason] = useState<string>('');

  const mutation = useMutation({
    mutationFn: (data: AdjustStockDto) => inventoryApi.adjustStock(data),
    onSuccess: () => {
      toast.success('Ajuste de inventario aplicado con éxito');
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.movements() });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] });
      onClose();
      setQuantity(0);
      setType('ADD');
      setReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al aplicar el ajuste de stock');
    },
  });

  const physical = stockNode
    ? (stockNode.physicalQuantity ?? stockNode.availableQuantity + stockNode.reservedQuantity)
    : 0;
  const available = stockNode?.availableQuantity ?? 0;
  const reserved = stockNode?.reservedQuantity ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockNode) return;
    if (quantity < 0 || (quantity <= 0 && type !== 'SET')) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    if (type === 'SUBTRACT' && quantity > available) {
      toast.error('No podés restar más cantidad de la que hay disponible');
      return;
    }
    if (type === 'SET' && quantity < reserved) {
      toast.error(`No podés fijar el físico por debajo de las ${reserved} unidades reservadas`);
      return;
    }
    if (!reason.trim()) {
      toast.error('El motivo del ajuste es obligatorio para la auditoría');
      return;
    }

    mutation.mutate({
      variantId: stockNode.variantId,
      warehouseId: stockNode.warehouseId,
      quantity,
      type,
      reason,
    });
  };

  if (!stockNode) return null;

  let projectedAvailable = available;
  let projectedPhysical = physical;
  if (type === 'ADD') {
    projectedAvailable = available + quantity;
    projectedPhysical = physical + quantity;
  } else if (type === 'SUBTRACT') {
    projectedAvailable = available - quantity;
    projectedPhysical = physical - quantity;
  } else if (type === 'SET') {
    projectedPhysical = quantity;
    projectedAvailable = quantity - reserved;
  }

  return (
    <Drawer
      open={open}
      title="Ajuste Manual de Stock"
      onClose={onClose}
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>Aplicar Ajuste</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.stackMd}>

        <div className={styles.adjustTargetBox}>
          <p className={styles.adjustTargetLabel}>Variante afectada:</p>
          <p className={styles.adjustTargetName}>{stockNode.productName}</p>
          <p className={styles.adjustTargetSku}>SKU: {stockNode.variantSku}</p>

          <div className={styles.adjustLocationRow}>
            <span className={styles.adjustLocationLabel}>Ubicación:</span>
            <span className={styles.adjustLocationValue}>{stockNode.warehouseName} ({stockNode.branchName})</span>
          </div>

          <div className={styles.stockStatsGrid}>
            <div>
              <p className={styles.stockStatLabel}>Físico</p>
              <p className={styles.stockStatValue}>{physical}</p>
            </div>
            <div>
              <p className={styles.stockStatLabel}>Reservado</p>
              <p className={`${styles.stockStatValue} ${reserved > 0 ? styles.stockStatWarning : ''}`}>{reserved}</p>
            </div>
            <div>
              <p className={styles.stockStatLabel}>Disponible</p>
              <p className={`${styles.stockStatValue} ${available <= 0 ? styles.stockStatDanger : styles.stockStatOk}`}>{available}</p>
            </div>
          </div>
        </div>

        <div className={styles.selectGroup}>
          <label className={styles.selectLabel}>Tipo de Operación</label>
          <select value={type} onChange={e => setType(e.target.value as AdjustStockDto['type'])} className={styles.select}>
            <option value="ADD">Entrada (+ Sumar al stock)</option>
            <option value="SUBTRACT">Salida (- Restar al stock)</option>
            <option value="SET">Inventario Físico (= Reemplazar stock físico)</option>
          </select>
        </div>

        <Input
          label={type === 'SET' ? 'Cantidad Física Contada' : 'Cantidad a Ajustar'}
          type="number"
          min={type === 'SET' ? '0' : '1'}
          value={quantity}
          onChange={e => setQuantity(Number(e.target.value))}
        />

        <div className={styles.textareaGroup}>
          <label className={styles.textareaLabel}>Motivo de Auditoría *</label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ej: Mercadería dañada, Ajuste cíclico, Sobrante..."
            rows={3}
            className={styles.textarea}
          />
        </div>

        <div className={styles.projectionBox}>
          <div className={styles.projectionCol}>
            <p className={styles.projectionLabel}>Actual (Fís / Disp)</p>
            <p className={styles.projectionValue}>{physical} / {available}</p>
          </div>
          <ArrowRightLeft size={20} className={styles.projectionArrow} />
          <div className={styles.projectionCol}>
            <p className={styles.projectionLabelAccent}>Proyección (Fís / Disp)</p>
            <p className={styles.projectionValueAccent}>{projectedPhysical} / {projectedAvailable}</p>
          </div>
        </div>

      </form>
    </Drawer>
  );
}
