import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceListsApi } from '@/api/priceLists.api';
import { queryKeys } from '@/api/queryKeys';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

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

  if (isLoading) return <div style={{ padding: '16px', color: 'var(--text-muted)' }}>Cargando listas...</div>;

  if (baseLists.length === 0) {
    return (
      <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>No hay listas de precios base configuradas.</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>Precios por Lista</h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {baseLists.map(list => {
          const isEditing = editingList === list.id;
          
          return (
            <div key={list.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-base)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{list.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{list.currency}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <input 
                      type="number" 
                      style={{ width: '100px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
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
