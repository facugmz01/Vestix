import { Table } from '@/components/ui';
import { ProductStatusBadge } from './ProductStatusBadge';
import { ProductActionsMenu } from './ProductActionsMenu';
import { Image as ImageIcon } from 'lucide-react';
import type { Product } from '@/types';
import styles from './ProductTable.module.css';

interface Props {
  products: Product[];
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

export function ProductTable({ products, onView, onEdit, onDelete }: Props) {
  return (
    <Table
      keyField="id"
      data={products}
      onRowClick={onView}
      columns={[
        {
          key: 'image',
          header: 'Img',
          render: (p) => (
            <div className={styles.thumb}>
              {p.images && p.images.length > 0 ? (
                <img src={p.images[0]} alt="preview" className={styles.thumbImg} />
              ) : (
                <ImageIcon size={16} color="var(--text-muted)" />
              )}
            </div>
          )
        },
        {
          key: 'name',
          header: 'Producto Madre',
          render: (p) => <span className={styles.name}>{p.name}</span>
        },
        {
          key: 'category',
          header: 'Categoría',
          render: (p) => <span className={styles.category}>{(p as any).category?.name || p.categoryId}</span>
        },
        {
          key: 'status',
          header: 'Estado',
          render: (p) => <ProductStatusBadge isActive={p.isActive} isPublished={p.isPublished} />
        },
        {
          key: 'actions',
          header: '',
          render: (p) => (
            <ProductActionsMenu
              product={p}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )
        }
      ]}
    />
  );
}
