import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Drawer, Button } from '@/components/ui';
import { promotionsApi, type BulkUpdateDto } from '@/api/promotions.api';
import { priceListsApi } from '@/api/priceLists.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Zap } from 'lucide-react';
import styles from '@/styles/DetailDrawerShared.module.css';


interface Props {
  open: boolean;
  onClose: () => void;
}

export function BulkPriceUpdateModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const [action, setAction] = useState<BulkUpdateDto['action']>('APPLY_PRICE_LIST_MODIFIER');
  const [priceListId, setPriceListId] = useState('');

  // Fetch only modifier lists
  const { data: priceLists } = useQuery({
    queryKey: queryKeys.priceLists.all({ type: 'MODIFIER' }),
    queryFn: () => priceListsApi.getPriceLists({ type: 'MODIFIER' }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (data: BulkUpdateDto) => promotionsApi.executeBulkUpdate(data),
    onSuccess: (res) => {
      toast.success(`Operación exitosa. Se actualizaron ${res.updatedCount} variantes.`);
      // Invalidate catalogs
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.promotions.all() });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al ejecutar operación masiva.');
    }
  });

  const handleSubmit = () => {
    if (action === 'APPLY_PRICE_LIST_MODIFIER' && !priceListId) {
      toast.error('Debe seleccionar una lista modificadora.');
      return;
    }
    mutation.mutate({ action, priceListId });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Actualización Masiva de Precios"
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending} icon={<Zap size={16} />}>
            Ejecutar Tarea (Peligro)
          </Button>
        </>
      }
    >
      <div className={styles.stack}>
        
        <div className={styles.warningPanel}>
          <h4 className={styles.warningPanelTitle}>⚠️ Operación Destructiva</h4>
          <p className={styles.warningPanelText}>
            Las actualizaciones masivas alteran la base de datos de precios fijos. Si aplicás una lista modificadora, sobrescribirá los precios base. Se recomienda generar un backup antes de proceder.
          </p>
        </div>

        <div>
          <label className={styles.formLabelBlock}>Acción a Ejecutar</label>
          <select 
            value={action} 
            onChange={e => setAction(e.target.value as any)}
            className={clsx(styles.select, styles.selectFull)}
          >
            <option value="APPLY_PRICE_LIST_MODIFIER">Aplicar Lista Modificadora al Precio Base</option>
            <option value="FLATTEN_PRICES">Aplanar Precios (Remover todas las reglas manuales)</option>
          </select>
        </div>

        {action === 'APPLY_PRICE_LIST_MODIFIER' && (
          <div>
            <label className={styles.formLabelBlock}>Seleccionar Lista Modificadora</label>
            <select 
              value={priceListId} 
              onChange={e => setPriceListId(e.target.value)}
              className={clsx(styles.select, styles.selectFull)}
            >
              <option value="">-- Seleccionar --</option>
              {priceLists?.data.map(pl => (
                <option key={pl.id} value={pl.id}>{pl.name} ({pl.modifierPercentage}%)</option>
              ))}
            </select>
            <p className={styles.hintSm}>
              Aplica el porcentaje de la lista seleccionada sobre los precios base de todas las variantes activas.
            </p>
          </div>
        )}

      </div>
    </Drawer>
  );
}
