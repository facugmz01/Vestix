import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Drawer, Badge, Table, Button, Pagination, StatusChip } from '@/components/ui';
import { queryKeys } from '@/api/queryKeys';
import { priceListsApi } from '@/api/priceLists.api';
import type { PriceList } from '@/types';
import { Percent, DollarSign, Edit2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>{priceList.name}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Código: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{priceList.code}</span></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            {priceList.isActive ? <StatusChip label="Activa" color="green" /> : <StatusChip label="Inactiva" color="gray" />}
            <div style={{ marginTop: '8px' }}>
              <Badge color={priceList.type === 'MODIFIER' ? 'purple' : 'blue'}>
                {priceList.type === 'BASE' ? 'Lista Base (Fija)' : `Modificadora (${priceList.modifierPercentage}%)`}
              </Badge>
            </div>
          </div>
        </div>

        {/* Content */}
        {priceList.type === 'MODIFIER' ? (
          <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
            <Percent size={48} color="var(--purple)" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ margin: '0 0 8px', fontSize: '18px' }}>Lista Modificadora Dinámica</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Esta lista aplica un factor de <strong>{priceList.modifierPercentage}%</strong> sobre los precios base de los productos.
              No se requieren asignar precios manualmente a nivel de Variante.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} /> Matriz de Precios
              </h4>
              <Badge color="gray">{total} SKUs configurados</Badge>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <Table
                keyField="id"
                data={items}
                columns={[
                  { key: 'sku', header: 'SKU', render: (i) => <span style={{ fontFamily: 'monospace' }}>{i.variantSku}</span> },
                  { key: 'name', header: 'Producto', render: (i) => i.variantName },
                  { key: 'base', header: 'Costo / Base', render: (i) => <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(i.basePrice || 0)}</span> },
                  { key: 'override', header: 'Precio Final', render: (i) => (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(i.overridePrice)}</span>
                      {!i.hasEntry && priceList.type === 'BASE' && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hereda base</span>
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
              <div style={{ marginTop: '16px' }}>
                <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
              </div>
            )}
          </div>
        )}

      </div>
    </Drawer>
  );
}
