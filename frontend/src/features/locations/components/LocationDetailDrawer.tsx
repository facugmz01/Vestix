import { Drawer, StatusChip, Badge } from '@/components/ui';
import type { StorageLocation } from '@/types';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  location: StorageLocation | null;
}

export function LocationDetailDrawer({ open, onClose, location }: Props) {
  if (!location) return null;

  const typeLabels = {
    'AREA': 'Área / Zona',
    'RACK': 'Rack / Módulo',
    'SHELF': 'Estante / Nivel',
    'BIN': 'Bin / Contenedor'
  };

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Ubicación" width="sm">
      <div className={styles.stack}>
        <div>
          <div className={styles.entityTitleRow}>
            <h3 className={styles.entityTitleMono}>{location.code}</h3>
            <Badge color="purple">{typeLabels[location.type as keyof typeof typeLabels] || location.type}</Badge>
            <StatusChip label={location.isActive ? 'Activa' : 'Inactiva'} color={location.isActive ? 'green' : 'gray'} size="sm" />
          </div>
          {location.name && (
            <p className={styles.entitySubtitle}>{location.name}</p>
          )}
        </div>

        {location.barcode && (
          <div className={styles.barcodePanel}>
            <p className={styles.barcodeLabel}>Código de Barras</p>
            <div className={styles.barcodeVisual}>
              ||||| ||| || |||| |||
            </div>
            <p className={styles.barcodeValue}>{location.barcode}</p>
          </div>
        )}

        <div className={`grid-responsive ${styles.infoGrid}`}>
          <InfoBox label="Sucursal" value={location.branchName || 'Desconocida'} />
          <InfoBox label="Depósito" value={location.warehouseName || location.warehouseId} />
          <InfoBox label="ID Sistema" value={location.id} />
          <InfoBox 
            label="Fecha Creación" 
            value={location.createdAt ? new Date(location.createdAt).toLocaleDateString() : '-'} 
          />
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
