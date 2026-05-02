import { Table } from '@/components/ui';
import { ProductStatusBadge } from './ProductStatusBadge';
import { ProductActionsMenu } from './ProductActionsMenu';
import { Image as ImageIcon } from 'lucide-react';
import type { Product } from '@/types';

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
      columns={[
        {
          key: 'image',
          header: 'Img',
          render: (p) => (
            <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p.images && p.images.length > 0 ? (
                <img src={p.images[0]} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ImageIcon size={16} color="var(--text-muted)" />
              )}
            </div>
          )
        },
        { 
          key: 'name', 
          header: 'Producto Madre',
          render: (p) => <span style={{ fontWeight: 600 }}>{p.name}</span>
        },
        { 
          key: 'category', 
          header: 'Categoría',
          render: (p) => <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{p.category?.name || p.categoryId}</span>
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
