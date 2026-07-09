import { Button } from '@/components/ui';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import type { Product } from '@/types';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  product: Product;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}

export function ProductActionsMenu({ product, onView, onEdit, onDelete }: Props) {
  return (
    <div className={styles.actionFooter}>
      <Button variant="ghost" size="sm" onClick={() => onView(product)} aria-label="Ver ficha" title="Ver producto">
        <Eye size={16} />
      </Button>
      <ActionGuard action="manage" subject="Catalog">
        <Button variant="ghost" size="sm" onClick={() => onEdit(product)} aria-label="Editar" title="Editar producto">
          <Edit2 size={16} />
        </Button>
      </ActionGuard>
      <ActionGuard action="manage" subject="Catalog">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onDelete(product)} 
          aria-label="Eliminar" 
          title="Eliminar producto"
        >
          <Trash2 size={16} color="var(--red)" />
        </Button>
      </ActionGuard>
    </div>
  );
}
