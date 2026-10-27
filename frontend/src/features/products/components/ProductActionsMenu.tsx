import { Button } from '@/components/ui';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import type { Product } from '@/types';
import styles from './ProductActionsMenu.module.css';

interface Props {
  product: Product;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

export function ProductActionsMenu({ product, onView, onEdit, onDelete }: Props) {
  return (
    <div className={styles.actionGroup}>
      <Button
        variant="ghost"
        size="sm"
        className={styles.actionBtn}
        onClick={(e) => {
          e.stopPropagation();
          onView(product);
        }}
        aria-label={`Ver ficha de ${product.name}`}
        title="Ver producto"
      >
        <Eye size={15} />
      </Button>
      <ActionGuard action="manage" subject="Catalog">
        <Button
          variant="edit"
          size="sm"
          className={styles.actionBtn}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(product);
          }}
          aria-label={`Editar ${product.name}`}
          title="Editar producto"
        >
          <Edit2 size={15} />
        </Button>
      </ActionGuard>
      <ActionGuard action="manage" subject="Catalog">
        <Button
          variant="danger"
          size="sm"
          className={styles.actionBtn}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(product);
          }}
          aria-label={`Eliminar ${product.name}`}
          title="Eliminar producto"
        >
          <Trash2 size={15} />
        </Button>
      </ActionGuard>
    </div>
  );
}
