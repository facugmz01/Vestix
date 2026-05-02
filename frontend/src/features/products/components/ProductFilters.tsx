import { SearchInput, FiltersBar, Badge } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { productsApi } from '@/api/products.api';

interface Props {
  total: number;
  search: string;
  onSearchChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
}

export function ProductFilters({ total, search, onSearchChange, categoryId, onCategoryChange, statusFilter, onStatusChange }: Props) {
  const { data: categories } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => productsApi.getCategories(),
  });

  return (
    <FiltersBar actions={<Badge color="gray">{total} productos madre</Badge>}>
      <SearchInput placeholder="Buscar por nombre..." onSearch={onSearchChange} defaultValue={search} />
      
      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px' }}
      >
        <option value="">Todas las Categorías</option>
        {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px' }}
      >
        <option value="">Todos los Estados</option>
        <option value="ACTIVE">Activos</option>
        <option value="PUBLISHED">Publicados (Web)</option>
        <option value="INACTIVE">Inactivos / Archivados</option>
      </select>
    </FiltersBar>
  );
}
