import { Drawer, StatusChip, Badge } from '@/components/ui';
import type { Warehouse } from '@/types';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  warehouse: Warehouse | null;
}

export function WarehouseDetailDrawer({ open, onClose, warehouse }: Props) {
  if (!warehouse) return null;

  const typeLabels = {
    'RETAIL': 'Venta al Público',
    'STORAGE': 'Almacenamiento Interno',
    'TRANSIT': 'Tránsito'
  };

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Depósito" width="sm">
      <div className={styles.stack}>
        <div>
          <div className={styles.entityTitleRow}>
            <h3 className={styles.entityTitle}>{warehouse.name}</h3>
            <Badge color="purple">{typeLabels[warehouse.type as keyof typeof typeLabels] || warehouse.type}</Badge>
            <StatusChip label={warehouse.isActive ? 'Activo' : 'Inactivo'} color={warehouse.isActive ? 'green' : 'gray'} size="sm" />
          </div>
          <p className={styles.entitySubtitle}>
            Código: <strong className={styles.entitySubtitleStrong}>{warehouse.code}</strong>
          </p>
        </div>

        <div className={`grid-responsive ${styles.infoGrid}`}>
          <InfoBox label="Sucursal Asociada" value={warehouse.branchName || warehouse.branchId} />
          <InfoBox label="Dirección Física" value={warehouse.address || 'Misma que sucursal / No especificada'} />
          <InfoBox label="ID Sistema" value={warehouse.id} />
          <InfoBox 
            label="Fecha Alta" 
            value={warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleDateString() : '-'} 
          />
        </div>

        <div className={`${styles.statusPanel} ${styles.statusPanelAccent}`}>
          <h4 className={styles.statusPanelTitle}>Gestión de Inventario</h4>
          <p className={styles.bodyText}>
            Los movimientos de stock y valorización para este depósito se gestionan desde el módulo de <strong className={styles.textBoldPrimary}>Existencias</strong>. Los ajustes de inventario afectarán a la contabilidad de la sucursal vinculada.
          </p>
        </div>
      </div>
    </Drawer>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.detailInfoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.detailInfoValue}>{value}</span>
    </div>
  );
}
