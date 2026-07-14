import { useEffect, useState, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

import { Drawer, Button, Input } from '@/components/ui';
import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';
import type { Attribute, Brand, Category } from '@/types';
import adminStyles from '@/styles/AdminListShared.module.css';
import drawerStyles from '@/styles/DetailDrawerShared.module.css';
import styles from './TaxonomyFormDrawer.module.css';

export type TaxonomyKind = 'categories' | 'brands' | 'attributes';

interface Props {
  open: boolean;
  kind: TaxonomyKind;
  onClose: () => void;
  categoryToEdit?: Category | null;
  brandToEdit?: Brand | null;
  attributeToEdit?: Attribute | null;
}

export function TaxonomyFormDrawer({
  open,
  kind,
  onClose,
  categoryToEdit,
  brandToEdit,
  attributeToEdit,
}: Props) {
  const queryClient = useQueryClient();
  const isEditing =
    (kind === 'categories' && !!categoryToEdit) ||
    (kind === 'brands' && !!brandToEdit) ||
    (kind === 'attributes' && !!attributeToEdit);

  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [valueDraft, setValueDraft] = useState('');
  const [error, setError] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => productsApi.getCategories(),
    enabled: open && kind === 'categories',
  });

  useEffect(() => {
    if (!open) return;
    setError('');
    setValueDraft('');
    if (kind === 'categories') {
      setName(categoryToEdit?.name ?? '');
      setParentId(categoryToEdit?.parentId ?? '');
      setValues([]);
    } else if (kind === 'brands') {
      setName(brandToEdit?.name ?? '');
      setParentId('');
      setValues([]);
    } else {
      setName(attributeToEdit?.name ?? '');
      setParentId('');
      setValues(attributeToEdit?.values?.map((v) => v.value) ?? []);
    }
  }, [open, kind, categoryToEdit, brandToEdit, attributeToEdit]);

  const invalidate = () => {
    if (kind === 'categories') queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
    else if (kind === 'brands') queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() });
    else queryClient.invalidateQueries({ queryKey: queryKeys.attributes.all() });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('El nombre es obligatorio');

      if (kind === 'categories') {
        const dto = { name: trimmed, parentId: parentId || undefined };
        return categoryToEdit
          ? productsApi.updateCategory(categoryToEdit.id, dto)
          : productsApi.createCategory(dto);
      }
      if (kind === 'brands') {
        return brandToEdit
          ? productsApi.updateBrand(brandToEdit.id, { name: trimmed })
          : productsApi.createBrand({ name: trimmed });
      }
      if (values.length === 0) throw new Error('Ingresá al menos un valor');
      return attributeToEdit
        ? productsApi.updateAttribute(attributeToEdit.id, { name: trimmed, values })
        : productsApi.createAttribute({ name: trimmed, values });
    },
    onSuccess: () => {
      const labels = {
        categories: isEditing ? 'Categoría actualizada' : 'Categoría creada',
        brands: isEditing ? 'Marca actualizada' : 'Marca creada',
        attributes: isEditing ? 'Atributo actualizado' : 'Atributo creado',
      };
      toast.success(labels[kind]);
      invalidate();
      onClose();
    },
    onError: (err: Error) => {
      const msg = err.message || 'Error al guardar';
      setError(msg);
      toast.error(msg);
    },
  });

  const titles = {
    categories: isEditing ? 'Editar categoría' : 'Nueva categoría',
    brands: isEditing ? 'Editar marca' : 'Nueva marca',
    attributes: isEditing ? 'Editar atributo' : 'Nuevo atributo',
  };

  const placeholders = {
    categories: 'Ej: Remeras',
    brands: 'Ej: Nike',
    attributes: 'Ej: Talle',
  };

  const parentOptions = categories.filter((c) => c.id !== categoryToEdit?.id);

  const commitValue = (raw: string) => {
    const parts = raw.split(',').map((v) => v.trim()).filter(Boolean);
    if (parts.length === 0) return;
    setValues((prev) => {
      const next = [...prev];
      for (const part of parts) {
        if (!next.some((v) => v.toLowerCase() === part.toLowerCase())) next.push(part);
      }
      return next;
    });
    setValueDraft('');
  };

  const onValueKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitValue(valueDraft);
    } else if (e.key === 'Backspace' && !valueDraft && values.length > 0) {
      setValues((prev) => prev.slice(0, -1));
    }
  };

  return (
    <Drawer
      open={open}
      title={titles[kind]}
      onClose={onClose}
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {isEditing ? 'Guardar' : 'Crear'}
          </Button>
        </>
      }
    >
      <div className={drawerStyles.formStackMd}>
        <Input
          label="Nombre *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholders[kind]}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && kind !== 'attributes' && mutation.mutate()}
        />

        {kind === 'categories' && (
          <label className={styles.field}>
            <span className={styles.label}>Categoría padre</span>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={adminStyles.filterSelectRadius}
            >
              <option value="">Sin padre (raíz)</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className={styles.hint}>Opcional. Usá padre para armar subcategorías.</span>
          </label>
        )}

        {kind === 'attributes' && (
          <div className={styles.field}>
            <span className={styles.label}>Valores *</span>
            <div className={styles.valuesBox}>
              {values.map((v) => (
                <span key={v} className={styles.valueChip}>
                  {v}
                  <button
                    type="button"
                    className={styles.removeChip}
                    onClick={() => setValues((prev) => prev.filter((x) => x !== v))}
                    aria-label={`Quitar ${v}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                className={styles.valueInput}
                value={valueDraft}
                onChange={(e) => setValueDraft(e.target.value)}
                onKeyDown={onValueKeyDown}
                onBlur={() => valueDraft.trim() && commitValue(valueDraft)}
                placeholder={values.length ? 'Otro valor…' : 'S, M, L — Enter para agregar'}
              />
            </div>
            <span className={styles.hint}>Separá con coma o Enter. Ej: S, M, L, XL</span>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </Drawer>
  );
}
