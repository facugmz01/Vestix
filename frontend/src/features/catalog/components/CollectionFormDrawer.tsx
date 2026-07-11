import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { Drawer, Button, Input } from '@/components/ui';
import { collectionsApi, type ProductCollection } from '@/api/collections.api';
import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';
import styles from '@/styles/DetailDrawerShared.module.css';

const schema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  season: z.string().optional(),
  year: z.coerce.number().min(2000).optional().or(z.literal('')),
  isActive: z.boolean(),
  productIds: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  collectionToEdit?: ProductCollection | null;
}

export function CollectionFormDrawer({ open, onClose, collectionToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!collectionToEdit;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', season: '', year: '', isActive: true, productIds: [] },
  });

  const selectedIds = watch('productIds');

  const { data: productsData } = useQuery({
    queryKey: queryKeys.products.all({ pageSize: 100 }),
    queryFn: () => productsApi.getProducts({ pageSize: 100 }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (collectionToEdit) {
      reset({
        name: collectionToEdit.name,
        season: collectionToEdit.season ?? '',
        year: collectionToEdit.year ?? '',
        isActive: collectionToEdit.isActive,
        productIds: collectionToEdit.products?.map(p => p.product.id) ?? [],
      });
    } else {
      reset({ name: '', season: '', year: '', isActive: true, productIds: [] });
    }
  }, [open, collectionToEdit, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const dto = {
        name: data.name,
        season: data.season || undefined,
        year: data.year === '' ? undefined : Number(data.year),
        isActive: data.isActive,
        productIds: data.productIds,
      };
      if (isEditing && collectionToEdit) {
        return collectionsApi.update(collectionToEdit.id, dto);
      }
      return collectionsApi.create(dto);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Colección actualizada' : 'Colección creada');
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all() });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || 'Error al guardar'),
  });

  const toggleProduct = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id];
    setValue('productIds', next);
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Colección' : 'Nueva Colección'}
      onClose={onClose}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit(d => mutation.mutate(d))} loading={isSubmitting || mutation.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form className={styles.formStackMd} onSubmit={handleSubmit(d => mutation.mutate(d))}>
        <Input label="Nombre *" {...register('name')} error={errors.name?.message} />
        <div className="grid-responsive grid-cols-2">
          <Input label="Temporada" placeholder="Verano, Invierno..." {...register('season')} />
          <Input label="Año" type="number" {...register('year')} />
        </div>
        <label className={styles.checkboxRow}>
          <input type="checkbox" {...register('isActive')} />
          Colección activa
        </label>

        <hr className={styles.formDivider} />
        <h4 className={styles.sectionPanelTitle}>Productos ({selectedIds.length})</h4>
        <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(productsData?.data ?? []).map(p => (
            <label key={p.id} className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={selectedIds.includes(p.id)}
                onChange={() => toggleProduct(p.id)}
              />
              {p.name}
            </label>
          ))}
        </div>
      </form>
    </Drawer>
  );
}
