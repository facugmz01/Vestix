import { Drawer, Badge } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/api/inventory.api';
import { queryKeys } from '@/api/queryKeys';
import { ArrowUpRight, ArrowDownRight, History, Package, Link2, Clock, MapPin } from 'lucide-react';

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

  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Movimiento" width="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando detalles de auditoría...</div>
        ) : movement ? (
          <>
            {/* Cabecera / Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: movement.type === 'ADD' ? 'var(--green-bg)' : movement.type === 'SUBTRACT' ? 'var(--red-bg)' : 'var(--blue-bg)',
                color: movement.type === 'ADD' ? 'var(--green)' : movement.type === 'SUBTRACT' ? 'var(--red)' : 'var(--blue)'
              }}>
                {movement.type === 'ADD' ? <ArrowUpRight size={32} /> : movement.type === 'SUBTRACT' ? <ArrowDownRight size={32} /> : <History size={32} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>
                  {movement.type === 'ADD' ? 'Entrada de Mercadería' : movement.type === 'SUBTRACT' ? 'Salida de Mercadería' : 'Ajuste Físico'}
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {new Date(movement.createdAt).toLocaleString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Cantidad</p>
                <p style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: movement.type === 'ADD' ? 'var(--green)' : movement.type === 'SUBTRACT' ? 'var(--red)' : 'var(--text-primary)' }}>
                  {movement.type === 'ADD' ? '+' : movement.type === 'SUBTRACT' ? '-' : ''}{movement.quantity}
                </p>
              </div>
            </div>

            {/* Artículo */}
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={16} /> Artículo Afectado
              </h4>
              <div style={{ padding: '16px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{movement.productName}</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SKU: {movement.variantSku}</p>
              </div>
            </div>

            {/* Ubicación */}
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} /> Ubicación Física
              </h4>
              <div style={{ padding: '16px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{movement.warehouseName}</p>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Sucursal: {movement.branchName}</p>
              </div>
            </div>

            {/* Trazabilidad (Traceability) */}
            <div>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link2 size={16} /> Trazabilidad (Auditoría)
              </h4>
              <div style={{ padding: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Origen / Tipo:</span>
                  <Badge color="purple">{movement.referenceType || 'SYSTEM_ADJUSTMENT'}</Badge>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Documento Ref:</span>
                  <span style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 600 }}>{movement.referenceId}</span>
                </div>

                <div className="grid-responsive grid-cols-120-1" style={{ gap: "12px" }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Motivo:</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{movement.reason || 'Sin motivo especificado'}</span>
                </div>
                
                {movement.unitCost && (
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Costo Unitario:</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(movement.unitCost)}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}>No se pudo cargar el movimiento.</div>
        )}

      </div>
    </Drawer>
  );
}
