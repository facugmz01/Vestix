import { Drawer, Table, Badge } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi, type EnrichedStockLevel } from '@/api/inventory.api';
import { History, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatMovementQty, getMovementLabel } from '../utils/movementLabels';
import { formatMovementReferenceId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  stockNode: EnrichedStockLevel | null;
}

export function StockMovementsDrawer({ open, onClose, stockNode }: Props) {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['inventory', 'movements', stockNode?.variantId, stockNode?.warehouseId],
    queryFn: () => inventoryApi.getMovements(stockNode!.variantId, stockNode!.warehouseId),
    enabled: open && !!stockNode,
  });

  if (!stockNode) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Kardex / Historial de Movimientos" width="lg">
      <div className={styles.stack}>

        <div className={styles.kardexHero}>
          <div>
            <h3 className={styles.kardexTitle}>{stockNode.productName}</h3>
            <p className={styles.kardexSku}>
              SKU: <span className={styles.mono}>{stockNode.variantSku}</span>
            </p>
          </div>
          <div className={styles.kardexAside}>
            <Badge color="gray">{stockNode.warehouseName}</Badge>
            <p className={styles.kardexBranch}>{stockNode.branchName}</p>
          </div>
        </div>

        <div>
          <h4 className={styles.sectionHeadingSm}>
            <History size={16} /> Últimas Transacciones
          </h4>

          <div className={styles.historyTableWrap}>
            {isLoading ? (
              <div className={styles.emptyState}>Cargando Kardex...</div>
            ) : (!movements || movements.length === 0) ? (
              <div className={styles.emptyState}>No hay movimientos registrados para este ítem en este depósito.</div>
            ) : (
              <Table
                keyField="id"
                data={movements}
                columns={[
                  { key: 'date', header: 'Fecha', render: (m) => new Date(m.createdAt).toLocaleString() },
                  {
                    key: 'type',
                    header: 'Operación',
                    render: (m) => {
                      const { direction } = formatMovementQty(m.type, m.quantity, m.sourceWarehouseId, m.destinationWarehouseId);
                      return (
                        <div className={styles.opRow}>
                          {direction === 'IN' ? <ArrowUpRight size={14} color="var(--green)" /> : direction === 'OUT' ? <ArrowDownRight size={14} color="var(--red)" /> : <History size={14} color="var(--accent)" />}
                          <span>{getMovementLabel(m.type)}</span>
                        </div>
                      );
                    }
                  },
                  {
                    key: 'quantity',
                    header: 'Cantidad',
                    render: (m) => {
                      const { text, direction } = formatMovementQty(m.type, m.quantity, m.sourceWarehouseId, m.destinationWarehouseId);
                      return (
                        <strong className={direction === 'IN' ? styles.qtyIn : direction === 'OUT' ? styles.qtyOut : styles.qtyNeutral}>
                          {text}
                        </strong>
                      );
                    }
                  },
                  { key: 'ref', header: 'Documento Ref.', render: (m) => <span className={styles.refMono}>{formatMovementReferenceId(m.referenceId, m.type)}</span> },
                ]}
              />
            )}
          </div>
        </div>

      </div>
    </Drawer>
  );
}
