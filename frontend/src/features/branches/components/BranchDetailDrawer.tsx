import { Drawer, StatusChip, Badge } from '@/components/ui';
import type { Branch } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  branch: Branch | null;
}

export function BranchDetailDrawer({ open, onClose, branch }: Props) {
  if (!branch) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Sucursal" width="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {branch.name}
            </h3>
            {branch.isMain && <StatusChip label="Casa Central" color="blue" size="sm" />}
            <StatusChip label={branch.isActive ? 'Activa' : 'Inactiva'} color={branch.isActive ? 'green' : 'gray'} size="sm" />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Código: <strong style={{ color: 'var(--text-primary)' }}>{branch.code}</strong>
          </p>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          <InfoBox label="Dirección" value={branch.address || 'No especificada'} />
          <InfoBox label="Teléfono" value={branch.phone || 'No especificado'} />
          <InfoBox label="ID Sistema" value={branch.id} />
          <InfoBox 
            label="Fecha Creación" 
            value={branch.createdAt ? new Date(branch.createdAt).toLocaleDateString() : '-'} 
          />
        </div>

        {/* Config POS */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
            Configuración POS
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={{ fontSize: '13px', margin: 0 }}>
              <span style={{ color: 'var(--text-muted)' }}>CUIT Local:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{branch.settings?.taxId || 'Por defecto'}</strong>
            </p>
            <p style={{ fontSize: '13px', margin: 0 }}>
              <span style={{ color: 'var(--text-muted)' }}>Cabecera Ticket:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{branch.settings?.posReceiptHeader || '-'}</strong>
            </p>
            <p style={{ fontSize: '13px', margin: 0 }}>
              <span style={{ color: 'var(--text-muted)' }}>Pie Ticket:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{branch.settings?.posReceiptFooter || '-'}</strong>
            </p>
          </div>
        </div>

        {/* User Summary */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
            Personal Asignado
          </h4>
          {branch.userCount !== undefined ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge color="blue">{branch.userCount} empleados</Badge>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>asociados a esta sucursal.</span>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Información no disponible.</p>
          )}
        </div>

      </div>
    </Drawer>
  );
}

function InfoBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}
