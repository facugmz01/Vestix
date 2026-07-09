import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceListsApi } from '@/api/priceLists.api';
import { queryKeys } from '@/api/queryKeys';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';
import styles from '@/styles/DetailDrawerShared.module.css';


export function VariantPricingPanel({ variantId, basePrice }: { variantId: string, basePrice: number }) {
  const queryClient = useQueryClient();

  const { data: priceListsData, isLoading } = useQuery({
    queryKey: queryKeys.priceLists.all(),
    queryFn: () => priceListsApi.getPriceLists({ pageSize: 100 }),
  });

  // Only BASE lists support explicit overrides
  const baseLists = priceListsData?.data.filter(l => l.type === 'BASE') || [];

  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [editingList, setEditingList] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: ({ listId, price }: { listId: string, price: number }) => 
      priceListsApi.updateItemPrice(listId, variantId, price),
    onSuccess: (_, variables) => {
      toast.success('Precio actualizado en la lista');
      queryClient.invalidateQueries({ queryKey: queryKeys.priceLists.all() });
      setEditingList(null);
    },
    onError: (err: any) => toast.error(err.message || 'Error al actualizar precio')
  });

  const handleSave = (listId: string) => {
    const val = overrides[listId];
    if (val === undefined) return setEditingList(null);
    mutation.mutate({ listId, price: val });
  };

  if (isLoading) return <div className={styles.loadingPanel}>Cargando listas...</div>;

  if (baseLists.length === 0) {
    return (
      <div className={styles.sectionPanel}>
        <p className={styles.scopeHint}>No hay listas de precios base configuradas.</p>
      </div>
    );
  }

  return (
    <div className={styles.sectionPanel}>
      <h4 className={styles.sectionPanelTitle}>Precios por Lista</h4>
      
      <div className={styles.lineItemsStack}>
        {baseLists.map(list => {
          const isEditing = editingList === list.id;
          
          return (
            <div key={list.id} className={styles.priceListRow}>
              <div>
                <div className={styles.selectLabel}>{list.name}</div>
                <div className={styles.textOrange}>{list.currency}</div>
              </div>
              
              <div className={styles.checkboxRow}>
                {isEditing ? (
                  <>
                    <input 
                      type="number" 
                      className={styles.priceInputNarrow}
                      value={overrides[list.id] ?? ''}
                      onChange={e => setOverrides({ ...overrides, [list.id]: Number(e.target.value) })}
                      placeholder="Precio..."
                      autoFocus
                    />
                    <Button variant="primary" size="sm" onClick={() => handleSave(list.id)} loading={mutation.isPending && mutation.variables?.listId === list.id}>Guardar</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingList(null)}>X</Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => { setEditingList(list.id); setOverrides({ ...overrides, [list.id]: basePrice }); }}>
                    Fijar Precio
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
