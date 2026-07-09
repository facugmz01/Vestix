import { Drawer, Table, Badge } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi, type EnrichedStockLevel } from '@/api/inventory.api';
import { History, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatMovementQty, getMovementLabel } from '../utils/movementLabels';
import { formatMovementReferenceId } from '@/utils/formatId';

interface Props {
  open: boolean;
  onClose: () => void;
  stockNode: EnrichedStockLevel | null;
}

export function StockMovementsDrawer({ open, onClose, stockNode }: Props) {
  const { data: movements, isLoading } = useQuery({
    queryKey: ['inventory', 'movements', stockNode?.variantId, stockNode?.warehouseId],
    queryFn: () => inventoryApi.getMovements(stockNode!.variantId, stockNode!.warehouseId),
    enabled: open && !!stockNode,
  });

  if (!stockNode) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Kardex / Historial de Movimientos" width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800 }}>{stockNode.productName}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>SKU: <span style={{ fontFamily: 'monospace' }}>{stockNode.variantSku}</span></p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Badge color="gray">{stockNode.warehouseName}</Badge>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{stockNode.branchName}</p>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} /> Últimas Transacciones
          </h4>
          
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando Kardex...</div>
            ) : (!movements || movements.length === 0) ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay movimientos registrados para este ítem en este depósito.</div>
            ) : (
              <Table
                keyField="id"
                data={movements}
                columns={[
                  { key: 'date', header: 'Fecha', render: (m) => new Date(m.createdAt).toLocaleString() },
                  { 
                    key: 'type', 
                    header: 'Operación', 
                    render: (m) => {
                      const { direction } = formatMovementQty(m.type, m.quantity, m.sourceWarehouseId, m.destinationWarehouseId);
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {direction === 'IN' ? <ArrowUpRight size={14} color="var(--green)" /> : direction === 'OUT' ? <ArrowDownRight size={14} color="var(--red)" /> : <History size={14} color="var(--blue)" />}
                          <span>{getMovementLabel(m.type)}</span>
                        </div>
                      );
                    }
                  },
                  { 
                    key: 'quantity', 
                    header: 'Cantidad', 
                    render: (m) => {
                      const { text, direction } = formatMovementQty(m.type, m.quantity, m.sourceWarehouseId, m.destinationWarehouseId);
                      return (
                        <strong style={{ color: direction === 'IN' ? 'var(--green)' : direction === 'OUT' ? 'var(--red)' : 'var(--text-primary)' }}>
                          {text}
                        </strong>
                      );
                    }
                  },
                  { key: 'ref', header: 'Documento Ref.', render: (m) => <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{formatMovementReferenceId(m.referenceId, m.type)}</span> },
                ]}
              />
            )}
          </div>
        </div>

      </div>
    </Drawer>
  );
}
