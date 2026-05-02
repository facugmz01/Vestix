import { Drawer, StatusChip, Badge } from '@/components/ui';
import type { CashRegister } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  register: CashRegister | null;
}

export function CashRegisterDetailDrawer({ open, onClose, register }: Props) {
  if (!register) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Caja" width="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {register.name}
            </h3>
            {register.status === 'OPEN' ? (
              <StatusChip label="Abierta" color="green" size="sm" />
            ) : (
              <StatusChip label="Cerrada" color="gray" size="sm" />
            )}
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            {register.isActive ? 'Operativa' : 'Inactiva en el sistema'}
          </p>
        </div>

        {/* Live Status Info */}
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', borderLeft: `4px solid ${register.status === 'OPEN' ? 'var(--green)' : 'var(--gray)'}` }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Estado del Turno
          </h4>
          {register.status === 'OPEN' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-secondary)' }}>
                Operador asignado: <strong style={{ color: 'var(--text-primary)' }}>{register.operatorName || 'Desconocido'}</strong>
              </p>
              <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-secondary)' }}>
                ID Turno Activo: <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>En progreso...</strong>
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              La caja se encuentra cerrada y disponible para que un cajero inicie turno.
            </p>
          )}
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
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
