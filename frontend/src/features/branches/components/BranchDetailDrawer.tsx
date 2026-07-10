import { Drawer, StatusChip, Badge } from '@/components/ui';
import type { Branch } from '@/types';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  branch: Branch | null;
}

export function BranchDetailDrawer({ open, onClose, branch }: Props) {
  if (!branch) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Sucursal" width="sm">
      <div className={styles.stack}>
        <div>
          <div className={styles.entityTitleRow}>
            <h3 className={styles.entityTitle}>{branch.name}</h3>
            {branch.isMain && <StatusChip label="Casa Central" color="blue" size="sm" />}
            <StatusChip label={branch.isActive ? 'Activa' : 'Inactiva'} color={branch.isActive ? 'green' : 'gray'} size="sm" />
          </div>
          <p className={styles.entitySubtitle}>
            Código: <strong className={styles.entitySubtitleStrong}>{branch.code}</strong>
          </p>
        </div>

        <div className={`grid-responsive ${styles.infoGrid}`}>
          <InfoBox label="Dirección" value={branch.address || 'No especificada'} />
          <InfoBox label="Teléfono" value={branch.phone || 'No especificado'} />
          <InfoBox label="ID Sistema" value={branch.id} />
          <InfoBox 
            label="Fecha Creación" 
            value={branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : '-'} 
          />
        </div>

        <div>
          <h4 className={styles.detailSectionTitle}>Configuración POS</h4>
          <div className={styles.configStack}>
            <p className={styles.configLine}>
              <span className={styles.textMuted}>CUIT Local:</span>{' '}
              <strong className={styles.textBoldPrimary}>{branch.settings?.taxId || 'Por defecto'}</strong>
            </p>
            <p className={styles.configLine}>
              <span className={styles.textMuted}>Cabecera Ticket:</span>{' '}
              <strong className={styles.textBoldPrimary}>{branch.settings?.posReceiptHeader || '-'}</strong>
            </p>
            <p className={styles.configLine}>
              <span className={styles.textMuted}>Pie Ticket:</span>{' '}
              <strong className={styles.textBoldPrimary}>{branch.settings?.posReceiptFooter || '-'}</strong>
            </p>
          </div>
        </div>

        <div>
          <h4 className={styles.detailSectionTitle}>Personal Asignado</h4>
          {branch.userCount !== undefined ? (
            <div className={styles.badgeMetaRow}>
              <Badge color="blue">{branch.userCount} empleados</Badge>
              <span className={styles.badgeMetaHint}>asociados a esta sucursal.</span>
            </div>
          ) : (
            <p className={styles.metaLineMuted}>Información no disponible.</p>
          )}
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
