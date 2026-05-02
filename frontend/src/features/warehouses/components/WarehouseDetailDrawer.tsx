import { Drawer, StatusChip, Badge } from '@/components/ui';
import type { Warehouse } from '@/types';

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {warehouse.name}
            </h3>
            <Badge color="purple">{typeLabels[warehouse.type as keyof typeof typeLabels] || warehouse.type}</Badge>
            <StatusChip label={warehouse.isActive ? 'Activo' : 'Inactivo'} color={warehouse.isActive ? 'green' : 'gray'} size="sm" />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Código: <strong style={{ color: 'var(--text-primary)' }}>{warehouse.code}</strong>
          </p>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          <InfoBox label="Sucursal Asociada" value={warehouse.branchName || warehouse.branchId} />
          <InfoBox label="Dirección Física" value={warehouse.address || 'Misma que sucursal / No especificada'} />
          <InfoBox label="ID Sistema" value={warehouse.id} />
          <InfoBox 
            label="Fecha Alta" 
            value={warehouse.createdAt ? new Date(warehouse.createdAt).toLocaleDateString() : '-'} 
          />
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', borderLeft: '4px solid var(--accent)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Gestión de Inventario
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Los movimientos de stock y valorización para este depósito se gestionan desde el módulo de <strong>Existencias</strong>. Los ajustes de inventario afectarán a la contabilidad de la sucursal vinculada.
          </p>
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
