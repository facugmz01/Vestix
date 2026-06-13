import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, Bookmark, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Button, EmptyState, TableSkeleton
} from '@/components/ui';
import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';

export default function TaxonomyPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');

  // Queries
  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => productsApi.getCategories(),
  });

  const { data: brands, isLoading: loadingBrands } = useQuery({
    queryKey: queryKeys.brands.all(),
    queryFn: () => productsApi.getBrands(),
  });

  // Mutations
  const createCatMutation = useMutation({
    mutationFn: (name: string) => productsApi.createCategory({ name }),
    onSuccess: () => {
      toast.success('Categoría creada');
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
    }
  });

  const createBrandMutation = useMutation({
    mutationFn: (name: string) => productsApi.createBrand({ name }),
    onSuccess: () => {
      toast.success('Marca creada');
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() });
    }
  });

  const handleAdd = () => {
    const name = window.prompt(`Nuevo nombre de ${activeTab === 'categories' ? 'categoría' : 'marca'}:`);
    if (!name) return;
    if (activeTab === 'categories') createCatMutation.mutate(name);
    else createBrandMutation.mutate(name);
  };

  return (
    <PageContainer 
      title="Categorías y Marcas" 
      subtitle="Gestioná la clasificación jerárquica y marcas de tu catálogo."
      action={
        <Button variant="primary" icon={<Plus size={16} />} onClick={handleAdd}>
          Nueva {activeTab === 'categories' ? 'Categoría' : 'Marca'}
        </Button>
      }
    >
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <Button 
          variant={activeTab === 'categories' ? 'primary' : 'ghost'} 
          onClick={() => setActiveTab('categories')}
        >
          Categorías
        </Button>
        <Button 
          variant={activeTab === 'brands' ? 'primary' : 'ghost'} 
          onClick={() => setActiveTab('brands')}
        >
          Marcas
        </Button>
      </div>

      <Section>
        {activeTab === 'categories' ? (
          loadingCats ? <TableSkeleton rows={5} /> :
          !categories?.length ? <EmptyState icon={<Tag size={40} />} title="Sin categorías" message="Carga categorías para organizar tus productos." /> :
          <TaxonomyList items={categories} icon={<Tag size={16} />} />
        ) : (
          loadingBrands ? <TableSkeleton rows={5} /> :
          !brands?.length ? <EmptyState icon={<Bookmark size={40} />} title="Sin marcas" message="Carga marcas para filtrar tus productos." /> :
          <TaxonomyList items={brands} icon={<Bookmark size={16} />} />
        )}
      </Section>
    </PageContainer>
  );
}

function TaxonomyList({ items, icon }: { items: any[], icon: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
      {items.map(item => (
        <div key={item.id} style={{ 
          padding: '16px', 
          background: 'var(--bg-elevated)', 
          borderRadius: 'var(--radius)', 
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--accent)' }}>{icon}</span>
            <span style={{ fontWeight: 600 }}>{item.name}</span>
          </div>
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => toast.error('Funcionalidad de borrado en desarrollo')} />
        </div>
      ))}
    </div>
  );
}
