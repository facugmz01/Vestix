import { SearchInput, FiltersBar, Badge } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { productsApi } from '@/api/products.api';
import styles from './ProductFilters.module.css';

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
      <SearchInput placeholder="Buscar por nombre..." onSearch={onSearchChange} value={search} />

      <select
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={styles.select}
      >
        <option value="">Todas las Categorías</option>
        {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className={styles.select}
      >
        <option value="">Todos los Estados</option>
        <option value="ACTIVE">Activos</option>
        <option value="PUBLISHED">Publicados (Web)</option>
        <option value="INACTIVE">Inactivos / Archivados</option>
      </select>
    </FiltersBar>
  );
}
