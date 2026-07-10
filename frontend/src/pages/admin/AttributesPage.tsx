import { useState } from 'react';
import clsx from 'clsx';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Tag, List, Pencil, Check, X, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  PageContainer, Section, Button, Input, EmptyState, TableSkeleton, ConfirmDialog, Tabs
} from '@/components/ui';
import { productsApi } from '@/api/products.api';
import adminStyles from '@/styles/AdminListShared.module.css';
import styles from './AttributesPage.module.css';

type Tab = 'categories' | 'brands' | 'attributes';

function InlineEditRow({
  label,
  extraLabel,
  extraValue,
  onSave,
  onDelete,
}: {
  label: string;
  extraLabel?: string;
  extraValue?: string;
  onSave: (name: string, extra?: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label);
  const [extra, setExtra] = useState(extraValue ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), extra.trim() || undefined);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(label);
    setExtra(extraValue ?? '');
    setEditing(false);
  };

  return (
    <>
      <tr className={styles.tr}>
        <td className={styles.td}>
          {editing ? (
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
              className={styles.editInput}
            />
          ) : (
            <span className={adminStyles.cellMedium}>{label}</span>
          )}
        </td>
        {extraLabel && (
          <td className={styles.td}>
            {editing ? (
              <input
                value={extra}
                onChange={e => setExtra(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder={extraLabel}
                className={styles.editInput}
              />
            ) : (
              <span className={adminStyles.cellSecondaryMuted}>{extraValue ?? '-'}</span>
            )}
          </td>
        )}
        <td className={styles.tdRight}>
          <div className={adminStyles.rowActions}>
            {editing ? (
              <>
                <Button variant="primary" size="sm" icon={<Check size={14} />} onClick={handleSave} />
                <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={handleCancel} />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEditing(true)} />
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setConfirmDelete(true)} />
              </>
            )}
          </div>
        </td>
      </tr>
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar"
        message={`¿Estás seguro de eliminar "${label}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={() => { onDelete(); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

function AttributeRow({ attr, onSave, onDelete }: {
  attr: { id: string; name: string; values?: { id: string; value: string }[] };
  onSave: (id: string, name: string, values: string[]) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(attr.name);
  const [valStr, setValStr] = useState(attr.values?.map((v) => v.value).join(', ') ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    const values = valStr.split(',').map((v: string) => v.trim()).filter(Boolean);
    onSave(attr.id, name.trim(), values);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(attr.name);
    setValStr(attr.values?.map((v) => v.value).join(', ') ?? '');
    setEditing(false);
  };

  return (
    <>
      <tr className={styles.tr}>
        <td className={clsx(styles.td, styles.tdName)}>
          {editing ? (
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              className={styles.editInput}
            />
          ) : (
            <span className={adminStyles.cellPrimary}>{attr.name}</span>
          )}
        </td>
        <td className={styles.td}>
          {editing ? (
            <input
              value={valStr}
              onChange={e => setValStr(e.target.value)}
              placeholder="S, M, L, XL"
              className={styles.editInput}
            />
          ) : (
            <div className={styles.chipRow}>
              {attr.values?.map((v) => (
                <span key={v.id} className={styles.chip}>
                  {v.value}
                </span>
              ))}
            </div>
          )}
        </td>
        <td className={styles.tdRight}>
          <div className={adminStyles.rowActions}>
            {editing ? (
              <>
                <Button variant="primary" size="sm" icon={<Check size={14} />} onClick={handleSave} />
                <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={handleCancel} />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEditing(true)} />
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => setConfirmDelete(true)} />
              </>
            )}
          </div>
        </td>
      </tr>
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar Atributo"
        message={`¿Eliminar el atributo "${attr.name}" y todos sus valores?`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={() => { onDelete(attr.id); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}

export default function AttributesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  });
  const { data: brands, isLoading: loadingBrands } = useQuery({
    queryKey: ['brands'],
    queryFn: () => productsApi.getBrands(),
  });
  const { data: attributes, isLoading: loadingAttrs } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => productsApi.getAttributes(),
  });

  const [newName, setNewName] = useState('');
  const [newExtra, setNewExtra] = useState('');

  const createCatMut = useMutation({
    mutationFn: (d: { name: string }) => productsApi.createCategory(d),
    onSuccess: () => { toast.success('Categoría creada'); queryClient.invalidateQueries({ queryKey: ['categories'] }); resetForm(); }
  });
  const updateCatMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => productsApi.updateCategory(id, { name }),
    onSuccess: () => { toast.success('Categoría actualizada'); queryClient.invalidateQueries({ queryKey: ['categories'] }); }
  });
  const deleteCatMut = useMutation({
    mutationFn: (id: string) => productsApi.deleteCategory(id),
    onSuccess: () => { toast.success('Categoría eliminada'); queryClient.invalidateQueries({ queryKey: ['categories'] }); }
  });

  const createBrandMut = useMutation({
    mutationFn: (d: { name: string }) => productsApi.createBrand(d),
    onSuccess: () => { toast.success('Marca creada'); queryClient.invalidateQueries({ queryKey: ['brands'] }); resetForm(); }
  });
  const updateBrandMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => productsApi.updateBrand(id, { name }),
    onSuccess: () => { toast.success('Marca actualizada'); queryClient.invalidateQueries({ queryKey: ['brands'] }); }
  });
  const deleteBrandMut = useMutation({
    mutationFn: (id: string) => productsApi.deleteBrand(id),
    onSuccess: () => { toast.success('Marca eliminada'); queryClient.invalidateQueries({ queryKey: ['brands'] }); }
  });

  const createAttrMut = useMutation({
    mutationFn: (d: { name: string; values: string[] }) => productsApi.createAttribute(d),
    onSuccess: () => { toast.success('Atributo creado'); queryClient.invalidateQueries({ queryKey: ['attributes'] }); resetForm(); }
  });
  const updateAttrMut = useMutation({
    mutationFn: ({ id, name, values }: { id: string; name: string; values: string[] }) =>
      productsApi.updateAttribute(id, { name, values }),
    onSuccess: () => { toast.success('Atributo actualizado'); queryClient.invalidateQueries({ queryKey: ['attributes'] }); }
  });
  const deleteAttrMut = useMutation({
    mutationFn: (id: string) => productsApi.deleteAttribute(id),
    onSuccess: () => { toast.success('Atributo eliminado'); queryClient.invalidateQueries({ queryKey: ['attributes'] }); }
  });

  const resetForm = () => { setNewName(''); setNewExtra(''); };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (activeTab === 'categories') createCatMut.mutate({ name: newName });
    else if (activeTab === 'brands') createBrandMut.mutate({ name: newName });
    else if (activeTab === 'attributes') {
      const values = newExtra.split(',').map(v => v.trim()).filter(Boolean);
      if (values.length === 0) { toast.error('Ingresá al menos un valor'); return; }
      createAttrMut.mutate({ name: newName, values });
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'categories', label: 'Categorías', icon: <Layers size={15} /> },
    { key: 'brands', label: 'Marcas', icon: <Tag size={15} /> },
    { key: 'attributes', label: 'Atributos', icon: <List size={15} /> },
  ];

  const isLoading =
    (activeTab === 'categories' && loadingCats) ||
    (activeTab === 'brands' && loadingBrands) ||
    (activeTab === 'attributes' && loadingAttrs);

  const newItemLabel =
    activeTab === 'categories' ? 'a Categoría' :
    activeTab === 'brands' ? 'a Marca' : ' Atributo';

  return (
    <PageContainer
      tabs={<Tabs items={CATALOG_TABS} />}
      title="Taxonomía"
      subtitle="Gestioná categorías, marcas y atributos de productos."
    >
      <div className={styles.tabBar}>
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setActiveTab(t.key); resetForm(); }}
            className={clsx(styles.tabBtn, activeTab === t.key && styles.tabBtnActive)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <Section title={`Nuevo${newItemLabel}`}>
          <form onSubmit={handleCreate} className={styles.createForm}>
            <Input
              label="Nombre *"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={
                activeTab === 'categories' ? 'Ej: Remeras' :
                activeTab === 'brands' ? 'Ej: Nike' : 'Ej: Talle'
              }
            />
            {activeTab === 'attributes' && (
              <Input
                label="Valores (separados por coma) *"
                value={newExtra}
                onChange={e => setNewExtra(e.target.value)}
                placeholder="S, M, L, XL"
              />
            )}
            <Button type="submit" variant="primary" icon={<Plus size={15} />}>
              Crear
            </Button>
          </form>
        </Section>

        <Section title={`${tabs.find(t => t.key === activeTab)?.label} configuradas`}>
          {isLoading ? <TableSkeleton rows={5} /> : (
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th className={styles.th}>Nombre</th>
                    {activeTab === 'attributes' && (
                      <th className={styles.th}>Valores</th>
                    )}
                    {activeTab === 'categories' && (
                      <th className={styles.th}>Categoría Padre</th>
                    )}
                    <th className={styles.thActions} />
                  </tr>
                </thead>
                <tbody>
                  {activeTab === 'categories' && categories?.map(cat => (
                    <InlineEditRow
                      key={cat.id}
                      label={cat.name}
                      extraLabel="Categoría Padre"
                      extraValue={(cat as { parent?: { name?: string } }).parent?.name ?? ''}
                      onSave={(name) => updateCatMut.mutate({ id: cat.id, name })}
                      onDelete={() => deleteCatMut.mutate(cat.id)}
                    />
                  ))}
                  {activeTab === 'brands' && brands?.map(brand => (
                    <InlineEditRow
                      key={brand.id}
                      label={brand.name}
                      onSave={(name) => updateBrandMut.mutate({ id: brand.id, name })}
                      onDelete={() => deleteBrandMut.mutate(brand.id)}
                    />
                  ))}
                  {activeTab === 'attributes' && attributes?.map(attr => (
                    <AttributeRow
                      key={attr.id}
                      attr={attr}
                      onSave={(id, name, values) => updateAttrMut.mutate({ id, name, values })}
                      onDelete={(id) => deleteAttrMut.mutate(id)}
                    />
                  ))}
                </tbody>
              </table>

              {activeTab === 'categories' && categories?.length === 0 && <EmptyState title="No hay categorías" icon={<Layers size={32} />} />}
              {activeTab === 'brands' && brands?.length === 0 && <EmptyState title="No hay marcas" icon={<Tag size={32} />} />}
              {activeTab === 'attributes' && attributes?.length === 0 && <EmptyState title="No hay atributos" icon={<List size={32} />} />}
            </div>
          )}
        </Section>
      </div>
    </PageContainer>
  );
}
