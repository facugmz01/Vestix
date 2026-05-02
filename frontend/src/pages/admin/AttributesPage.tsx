import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Tag, List } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Button, Input,
  EmptyState, TableSkeleton
} from '@/components/ui';
import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';

export default function AttributesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'attributes' | 'price-lists'>('attributes');

  // Queries
  const { data: attributes, isLoading: loadingAttrs } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => productsApi.getAttributes(),
  });

  const { data: priceLists, isLoading: loadingPrices } = useQuery({
    queryKey: ['price-lists'],
    queryFn: () => productsApi.getPriceLists(),
  });

  // Mutations
  const createAttrMutation = useMutation({
    mutationFn: (data: { name: string; values: string[] }) => productsApi.createAttribute(data),
    onSuccess: () => {
      toast.success('Atributo creado');
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    }
  });

  const createPriceMutation = useMutation({
    mutationFn: (data: { name: string; margin: number }) => productsApi.createPriceList(data),
    onSuccess: () => {
      toast.success('Lista de precios creada');
      queryClient.invalidateQueries({ queryKey: ['price-lists'] });
    }
  });

  // Form States
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrValues, setNewAttrValues] = useState('');
  const [newPriceName, setNewPriceName] = useState('');
  const [newPriceMargin, setNewPriceMargin] = useState(0);

  const handleCreateAttribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName || !newAttrValues) return;
    const values = newAttrValues.split(',').map(v => v.trim()).filter(Boolean);
    createAttrMutation.mutate({ name: newAttrName, values });
    setNewAttrName('');
    setNewAttrValues('');
  };

  const handleCreatePriceList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriceName || newPriceMargin <= 0) return;
    createPriceMutation.mutate({ name: newPriceName, margin: 1 + (newPriceMargin / 100) });
    setNewPriceName('');
    setNewPriceMargin(0);
  };

  return (
    <PageContainer 
      title="Atributos y Precios" 
      subtitle="Configurá los talles, colores y márgenes de ganancia globales."
    >
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <Button 
          variant={activeTab === 'attributes' ? 'primary' : 'secondary'} 
          onClick={() => setActiveTab('attributes')}
          icon={<Tag size={16} />}
        >
          Atributos (Talles/Colores)
        </Button>
        <Button 
          variant={activeTab === 'price-lists' ? 'primary' : 'secondary'} 
          onClick={() => setActiveTab('price-lists')}
          icon={<List size={16} />}
        >
          Listas de Precios
        </Button>
      </div>

      {activeTab === 'attributes' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
          <Section title="Nuevo Atributo">
            <form onSubmit={handleCreateAttribute} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input 
                label="Nombre (ej: Talle)" 
                value={newAttrName} 
                onChange={e => setNewAttrName(e.target.value)} 
                placeholder="Nombre del atributo"
              />
              <Input 
                label="Valores (separados por coma)" 
                value={newAttrValues} 
                onChange={e => setNewAttrValues(e.target.value)} 
                placeholder="S, M, L, XL"
              />
              <Button type="submit" variant="primary" block disabled={createAttrMutation.isPending}>
                Crear Atributo
              </Button>
            </form>
          </Section>

          <Section title="Atributos Configurados">
            {loadingAttrs ? <TableSkeleton /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {attributes?.map(attr => (
                  <div key={attr.id} style={{ padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h4 style={{ fontWeight: 600 }}>{attr.name}</h4>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => productsApi.deleteAttribute(attr.id).then(() => queryClient.invalidateQueries({ queryKey: ['attributes'] }))} />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {attr.values.map(v => (
                        <span key={v.id} style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-base)', border: '1px solid var(--border)', fontSize: '12px' }}>
                          {v.value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {attributes?.length === 0 && <EmptyState title="No hay atributos" icon={<Tag size={32} />} />}
              </div>
            )}
          </Section>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '24px' }}>
          <Section title="Nueva Lista">
            <form onSubmit={handleCreatePriceList} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input 
                label="Nombre de Lista" 
                value={newPriceName} 
                onChange={e => setNewPriceName(e.target.value)} 
                placeholder="Ej: Minorista"
              />
              <Input 
                label="Margen de Ganancia (%)" 
                type="number"
                value={newPriceMargin} 
                onChange={e => setNewPriceMargin(Number(e.target.value))} 
              />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Si el costo es $1000 y el margen es 50%, el precio de venta será $1500.
              </p>
              <Button type="submit" variant="primary" block disabled={createPriceMutation.isPending}>
                Crear Lista
              </Button>
            </form>
          </Section>

          <Section title="Listas de Precios Activas">
            {loadingPrices ? <TableSkeleton /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {priceLists?.map(pl => (
                  <div key={pl.id} style={{ padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontWeight: 600 }}>{pl.name}</h4>
                      <span style={{ fontSize: '14px', color: 'var(--brand-primary)' }}>Margen: +{Math.round((pl.margin - 1) * 100)}%</span>
                    </div>
                    <Button variant="ghost" size="sm" icon={<Trash2 size={16} />} onClick={() => productsApi.deletePriceList(pl.id).then(() => queryClient.invalidateQueries({ queryKey: ['price-lists'] }))} />
                  </div>
                ))}
                {priceLists?.length === 0 && <EmptyState title="No hay listas de precios" icon={<List size={32} />} />}
              </div>
            )}
          </Section>
        </div>
      )}
    </PageContainer>
  );
}
