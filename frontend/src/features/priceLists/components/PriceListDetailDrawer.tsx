import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer, Badge, Table, Button, Pagination, StatusChip } from '@/components/ui';
import { queryKeys } from '@/api/queryKeys';
import { priceListsApi } from '@/api/priceLists.api';
import type { PriceList } from '@/types';
import { Percent, DollarSign, Edit2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/styles/DetailDrawerShared.module.css';


interface Props {
  open: boolean;
  onClose: () => void;
  priceList: PriceList | null;
}

export function PriceListDetailDrawer({ open, onClose, priceList }: Props) {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: queryKeys.priceLists.items(priceList?.id || ''),
    queryFn: () => priceListsApi.getItems(priceList!.id, page, 20),
    enabled: open && !!priceList && priceList.type === 'BASE', // Only base lists have explicit item overrides
  });

  if (!priceList) return null;

  const items = data?.data || [];
  const total = data?.total || 0;


  return (
    <Drawer open={open} onClose={onClose} title="Detalle de Lista de Precios" width="lg">
      <div className={styles.stack}>
        
        {/* Header */}
        <div className={styles.detailInfoRow}>
          <div>
            <h3 className={styles.entityTitle}>{priceList.name}</h3>
            <p className={styles.entitySubtitle}>Código: <span className={styles.monoBold}>{priceList.code}</span></p>
          </div>
          <div className={styles.openingAside}>
            {priceList.isActive ? <StatusChip label="Activa" color="green" /> : <StatusChip label="Inactiva" color="gray" />}
            <div className={styles.balanceAction}>
              <Badge color={priceList.type === 'MODIFIER' ? 'purple' : 'blue'}>
                {priceList.type === 'BASE' ? 'Lista Base (Fija)' : `Modificadora (${priceList.modifierPercentage}%)`}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        {priceList.type === 'MODIFIER' ? (
          <div className={styles.emptyStateLg}>
            <Percent size={48} color="var(--purple)" className={styles.purchaseEmptyIcon} />
            <h4 className={styles.sectionPanelTitle}>Lista Modificadora Dinámica</h4>
            <p className={styles.scopeHint}>
              Esta lista aplica un factor de <strong>{priceList.modifierPercentage}%</strong> sobre los precios base de los productos.
              No se requieren asignar precios manualmente a nivel de Variante.
            </p>
          </div>
        ) : (
          <div>
            <div className={styles.sectionHeaderRow}>
              <h4 className={styles.sectionHeading}>
                <DollarSign size={18} /> Matriz de Precios
              </h4>
              <Badge color="gray">{total} SKUs configurados</Badge>
            </div>

            <div className={styles.historyTableWrap}>
              <Table
                keyField="id"
                data={items}
                columns={[
                  { key: 'sku', header: 'SKU', render: (i) => <span className={styles.mono}>{i.variantSku}</span> },
                  { key: 'name', header: 'Producto', render: (i) => i.variantName },
                  { key: 'base', header: 'Costo / Base', render: (i) => <span className={styles.textMuted}>{formatCurrency(i.basePrice || 0)}</span> },
                  { key: 'override', header: 'Precio Final', render: (i) => (
                    <div className={styles.lineCol}>
                      <span className={styles.textMedium}>{formatCurrency(i.overridePrice)}</span>
                      {!i.hasEntry && priceList.type === 'BASE' && (
                        <span className={styles.textOrange}>Hereda base</span>
                      )}
                    </div>
                  ) },
                  { 
                    key: 'actions', 
                    header: '', 
                    render: () => <Button variant="ghost" size="sm"><Edit2 size={14} /></Button> 
                  }
                ]}
              />
            </div>
            {total > 20 && (
              <div className={styles.receiptSubmit}>
                <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
              </div>
            )}
          </div>
        )}

      </div>
    </Drawer>
  );
}
