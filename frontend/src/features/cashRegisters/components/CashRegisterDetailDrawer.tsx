import clsx from 'clsx';
import { Drawer, StatusChip } from '@/components/ui';
import type { CashRegister } from '@/types';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  register: CashRegister | null;
}

export function CashRegisterDetailDrawer({ open, onClose, register }: Props) {
  if (!register) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Caja" width="sm">
      <div className={styles.stack}>
        <div>
          <div className={styles.entityTitleRow}>
            <h3 className={styles.entityTitle}>{register.name}</h3>
            {register.status === 'OPEN' ? (
              <StatusChip label="Abierta" color="green" size="sm" />
            ) : (
              <StatusChip label="Cerrada" color="gray" size="sm" />
            )}
          </div>
          <p className={styles.entitySubtitle}>
            {register.isActive ? 'Operativa' : 'Inactiva en el sistema'}
          </p>
        </div>

        <div className={clsx(styles.statusPanel, register.status === 'OPEN' ? styles.statusPanelOpen : styles.statusPanelClosed)}>
          <h4 className={styles.statusPanelTitle}>Estado del Turno</h4>
          {register.status === 'OPEN' ? (
            <div className={styles.metaStack}>
              <p className={styles.metaLine}>
                Operador asignado: <strong className={styles.metaStrong}>{register.operatorName || 'Desconocido'}</strong>
              </p>
              <p className={styles.metaLine}>
                ID Turno Activo: <strong className={styles.metaMono}>En progreso...</strong>
              </p>
            </div>
          ) : (
            <p className={styles.metaLineMuted}>
              La caja se encuentra cerrada y disponible para que un cajero inicie turno.
            </p>
          )}
        </div>

        <div className={`grid-responsive ${styles.infoGrid}`}>
          <InfoBox label="Sucursal" value={register.branchName || register.branchId} />
          <InfoBox label="ID Sistema" value={register.id} />
          <InfoBox 
            label="Fecha Creación" 
            value={register.createdAt ? new Date(register.createdAt).toLocaleDateString() : '-'} 
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
