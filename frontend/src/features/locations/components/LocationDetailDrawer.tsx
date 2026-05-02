import { Drawer, StatusChip, Badge } from '@/components/ui';
import type { StorageLocation } from '@/types';

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'monospace' }}>
              {location.code}
            </h3>
            <Badge color="purple">{typeLabels[location.type as keyof typeof typeLabels] || location.type}</Badge>
            <StatusChip label={location.isActive ? 'Activa' : 'Inactiva'} color={location.isActive ? 'green' : 'gray'} size="sm" />
          </div>
          {location.name && (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              {location.name}
            </p>
          )}
        </div>

        {/* Barcode Section (Mock visual) */}
        {location.barcode && (
          <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#666', textTransform: 'uppercase' }}>Código de Barras</p>
            <div style={{ fontFamily: 'monospace', fontSize: '20px', letterSpacing: '4px', color: '#000', marginTop: '8px' }}>
              ||||| ||| || |||| |||
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#000', fontWeight: 'bold' }}>{location.barcode}</p>
          </div>
        )}

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
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
