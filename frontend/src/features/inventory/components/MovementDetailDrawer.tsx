import { Drawer, Badge } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';
import { queryKeys } from '@/api/queryKeys';
import { ArrowUpRight, ArrowDownRight, History, Package, Link2, Clock, MapPin } from 'lucide-react';
import { formatMovementQty, getMovementLabel } from '../utils/movementLabels';
import { formatMovementReferenceId } from '@/utils/formatId';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  movementId: string | null;
}

export function MovementDetailDrawer({ open, onClose, movementId }: Props) {
  const { data: movement, isLoading } = useQuery({
    queryKey: queryKeys.stock.movementDetail(movementId || ''),
    queryFn: () => inventoryApi.getMovementDetail(movementId!),
    enabled: open && !!movementId,
  });

  if (!movementId) return null;

  const qty = movement
    ? formatMovementQty(movement.type, movement.quantity, movement.sourceWarehouseId, movement.destinationWarehouseId)
    : null;

  const iconClass = qty?.direction === 'IN'
    ? styles.movementIconIn
    : qty?.direction === 'OUT'
      ? styles.movementIconOut
      : styles.movementIconNeutral;

  const qtyColor = qty?.direction === 'IN'
    ? 'var(--green)'
    : qty?.direction === 'OUT'
      ? 'var(--red)'
      : 'var(--text-primary)';

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Movimiento" width="md">
      <div className={styles.stack}>

        {isLoading ? (
          <div className={styles.emptyStateLg}>Cargando detalles de auditoría...</div>
        ) : movement && qty ? (
          <>
            <div className={styles.movementHero}>
              <div className={`${styles.movementIcon} ${iconClass}`}>
                {qty.direction === 'IN' ? <ArrowUpRight size={32} /> : qty.direction === 'OUT' ? <ArrowDownRight size={32} /> : <History size={32} />}
              </div>
              <div className={styles.movementHeroBody}>
                <h3 className={styles.movementTitle}>
                  {getMovementLabel(movement.type)}
                </h3>
                <p className={styles.movementMeta}>
                  <Clock size={12} /> {new Date(movement.createdAt).toLocaleString()}
                </p>
              </div>
              <div className={styles.movementQtyAside}>
                <p className={styles.movementQtyLabel}>Cantidad</p>
                <p className={styles.movementQtyValue} style={{ color: qtyColor }}>
                  {qty.text}
                </p>
              </div>
            </div>

            <div>
              <h4 className={styles.sectionLabel}>
                <Package size={16} /> Artículo Afectado
              </h4>
              <div className={styles.detailBox}>
                <p className={styles.detailTitle}>{movement.productName}</p>
                <p className={styles.detailSub}>SKU: {movement.variantSku}</p>
              </div>
            </div>

            <div>
              <h4 className={styles.sectionLabel}>
                <MapPin size={16} /> Ubicación Física
              </h4>
              <div className={styles.detailBox}>
                <p className={styles.detailTitle}>{movement.warehouseName}</p>
                <p className={styles.detailSub}>Sucursal: {movement.branchName}</p>
              </div>
            </div>

            <div>
              <h4 className={styles.sectionLabel}>
                <Link2 size={16} /> Trazabilidad (Auditoría)
              </h4>
              <div className={styles.auditPanel}>
                <div className={styles.auditGrid}>
                  <span className={styles.auditLabel}>Origen / Tipo:</span>
                  <Badge color="purple">{movement.referenceType || movement.type}</Badge>
                </div>

                <div className={styles.auditGrid}>
                  <span className={styles.auditLabel}>Documento Ref:</span>
                  <span className={styles.auditValueMono}>{formatMovementReferenceId(movement.referenceId, movement.type)}</span>
                </div>

                <div className={`${styles.auditGridNoMargin} grid-responsive grid-cols-120-1`}>
                  <span className={styles.auditLabel}>Motivo:</span>
                  <span className={styles.auditValue}>{movement.reason || 'Sin motivo especificado'}</span>
                </div>

                {movement.unitCost != null && movement.unitCost > 0 && (
                  <div className={styles.auditDivider}>
                    <span className={styles.auditLabel}>Costo Unitario:</span>
                    <span className={styles.auditValue} style={{ fontWeight: 600 }}>
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(movement.unitCost)}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </>
        ) : (
          <div className={styles.errorEmpty}>No se pudo cargar el movimiento.</div>
        )}

      </div>
    </Drawer>
  );
}
