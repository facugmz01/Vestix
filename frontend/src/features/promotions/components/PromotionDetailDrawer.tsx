import { Drawer, Badge, Table, StatusChip } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { promotionsApi } from '@/api/promotions.api';
import type { Promotion } from '@/types';
import { Tag, AlertTriangle, Eye } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface Props {
  open: boolean;
  onClose: () => void;
  promotion: Promotion | null;
}

export function PromotionDetailDrawer({ open, onClose, promotion }: Props) {
  // Fetch Impact Preview
  const { data: impact, isLoading: isLoadingImpact } = useQuery({
    queryKey: queryKeys.promotions.impact(promotion?.id || ''),
    queryFn: () => promotionsApi.getImpactPreview(promotion!.id),
    enabled: open && !!promotion && promotion.isActive,
  });

  if (!promotion) return null;


  return (
    <Drawer open={open} onClose={onClose} title="Análisis de Promoción" width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '8px', background: 'var(--accent-muted)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>{promotion.name}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                Alcance: <Badge color="gray">{promotion.applicableTo.type}</Badge>
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {promotion.isActive ? <StatusChip label="Activa" color="green" /> : <StatusChip label="Inactiva" color="gray" />}
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Vigencia: {new Date(promotion.startDate).toLocaleDateString()} al {promotion.endDate ? new Date(promotion.endDate).toLocaleDateString() : 'Indefinido'}
            </p>
          </div>
        </div>

        {/* Conflicts Warning */}
        {promotion.conflictsWith && promotion.conflictsWith.length > 0 && (
          <div style={{ padding: '16px', background: 'var(--red-bg)', border: '1px solid var(--red)', borderRadius: 'var(--radius)', display: 'flex', gap: '12px' }}>
            <AlertTriangle color="var(--red)" size={24} />
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: 'var(--red)' }}>Conflicto de Promociones (Stacking Clash)</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>
                Esta promoción solapa su alcance con otras {promotion.conflictsWith.length} promociones activas. El motor POS aplicará automáticamente la que mayor beneficio le otorgue al cliente, pero deberías revisar la configuración.
              </p>
            </div>
          </div>
        )}

        {/* Impact Preview */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} /> Previsualización de Impacto (Simulación)
          </h4>
          
          {isLoadingImpact ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Analizando alcance en catálogo...</div>
          ) : impact ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Variantes Afectadas</p>
                  <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 'bold' }}>{impact.affectedVariantsCount}</p>
                </div>
                <div style={{ flex: 1, padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Descuento Promedio Aplicado</p>
                  <p style={{ margin: '4px 0 0', fontSize: '24px', fontWeight: 'bold', color: 'var(--green)' }}>{impact.averageDiscountPercentage}%</p>
                </div>
              </div>

              <h5 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Muestra Aleatoria de Precios Resultantes</h5>
              <Table
                keyField="sku"
                data={impact.sampleVariants}
                columns={[
                  { key: 'sku', header: 'SKU', render: (v) => <span style={{ fontFamily: 'monospace' }}>{v.sku}</span> },
                  { key: 'original', header: 'Precio Normal', render: (v) => <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{formatCurrency(v.originalPrice)}</span> },
                  { key: 'discounted', header: 'Con Promo', render: (v) => <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>{formatCurrency(v.discountedPrice)}</span> },
                ]}
              />
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
              Impacto no disponible o promoción inactiva.
            </div>
          )}
        </div>

      </div>
    </Drawer>
  );
}
