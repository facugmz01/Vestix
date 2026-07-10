import { Drawer, Badge, Table, StatusChip } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { promotionsApi } from '@/api/promotions.api';
import type { Promotion } from '@/types';
import { Tag, AlertTriangle, Eye } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/styles/DetailDrawerShared.module.css';


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
      <div className={styles.stack}>
        
        {/* Header */}
        <div className={styles.promoHeader}>
          <div className={styles.promoHeaderLeft}>
            <div className={styles.promoIcon}>
              <Tag size={24} />
            </div>
            <div>
              <h3 className={styles.entityTitle}>{promotion.name}</h3>
              <p className={styles.entitySubtitle}>
                Alcance: <Badge color="gray">{promotion.applicableTo.type}</Badge>
              </p>
            </div>
          </div>
          <div className={styles.openingAside}>
            {promotion.isActive ? <StatusChip label="Activa" color="green" /> : <StatusChip label="Inactiva" color="gray" />}
            <p className={styles.promoDateHint}>
              Vigencia: {new Date(promotion.startDate).toLocaleDateString()} al {promotion.endDate ? new Date(promotion.endDate).toLocaleDateString() : 'Indefinido'}
            </p>
          </div>
        </div>

        {/* Conflicts Warning */}
        {promotion.conflictsWith && promotion.conflictsWith.length > 0 && (
          <div className={styles.promoConflict}>
            <AlertTriangle color="var(--red)" size={24} />
            <div>
              <h4 className={styles.promoConflictTitle}>Conflicto de Promociones (Stacking Clash)</h4>
              <p className={styles.promoConflictText}>
                Esta promoción solapa su alcance con otras {promotion.conflictsWith.length} promociones activas. El motor POS aplicará automáticamente la que mayor beneficio le otorgue al cliente, pero deberías revisar la configuración.
              </p>
            </div>
          </div>
        )}

        {/* Impact Preview */}
        <div>
          <h4 className={styles.sectionHeading}>
            <Eye size={18} /> Previsualización de Impacto (Simulación)
          </h4>
          
          {isLoadingImpact ? (
            <div className={styles.emptyCenter}>Analizando alcance en catálogo...</div>
          ) : impact ? (
            <div className={styles.formStackSm}>
              <div className={styles.impactRow}>
                <div className={styles.statBoxMini}>
                  <p className={styles.hintSm}>Variantes Afectadas</p>
                  <p className={styles.statBoxMiniValue}>{impact.affectedVariantsCount}</p>
                </div>
                <div className={styles.statBoxMini}>
                  <p className={styles.hintSm}>Descuento Promedio Aplicado</p>
                  <p className={styles.statBoxMiniValueGreen}>{impact.averageDiscountPercentage}%</p>
                </div>
              </div>

              <h5 className={styles.impactSampleTitle}>Muestra Aleatoria de Precios Resultantes</h5>
              <Table
                keyField="sku"
                data={impact.sampleVariants}
                columns={[
                  { key: 'sku', header: 'SKU', render: (v) => <span className={styles.mono}>{v.sku}</span> },
                  { key: 'original', header: 'Precio Normal', render: (v) => <span className={styles.strikethroughMuted}>{formatCurrency(v.originalPrice)}</span> },
                  { key: 'discounted', header: 'Con Promo', render: (v) => <span className={styles.textBoldGreen}>{formatCurrency(v.discountedPrice)}</span> },
                ]}
              />
            </div>
          ) : (
            <div className={styles.emptyStateLg}>
              Impacto no disponible o promoción inactiva.
            </div>
          )}
        </div>

      </div>
    </Drawer>
  );
}
