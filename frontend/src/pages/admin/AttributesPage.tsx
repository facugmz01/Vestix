import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Tag, List, Pencil, Check, X, Layers, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

import {
  PageContainer, Section, Button, Input,
  EmptyState, TableSkeleton, ConfirmDialog
} from '@/components/ui';
import { productsApi } from '@/api/products.api';

type Tab = 'categories' | 'brands' | 'attributes' | 'price-lists';

// ─── Inline Edit Row Component ────────────────────────────────────────────────
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
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '12px 16px' }}>
          {editing ? (
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 'var(--radius)',
                border: '1px solid var(--accent)', background: 'var(--bg-base)',
                color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
              }}
            />
          ) : (
            <span style={{ fontWeight: 500 }}>{label}</span>
          )}
        </td>
        {extraLabel && (
          <td style={{ padding: '12px 16px' }}>
            {editing ? (
              <input
                value={extra}
                onChange={e => setExtra(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                placeholder={extraLabel}
                style={{
                  width: '100%', padding: '6px 10px', borderRadius: 'var(--radius)',
                  border: '1px solid var(--accent)', background: 'var(--bg-base)',
                  color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
                }}
              />
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{extraValue ?? '-'}</span>
            )}
          </td>
        )}
        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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

// ─── Attribute Row (special: shows chip values) ───────────────────────────────
function AttributeRow({ attr, onSave, onDelete }: {
  attr: any;
  onSave: (id: string, name: string, values: string[]) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(attr.name);
  const [valStr, setValStr] = useState(attr.values?.map((v: any) => v.value).join(', ') ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    const values = valStr.split(',').map((v: string) => v.trim()).filter(Boolean);
    onSave(attr.id, name.trim(), values);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(attr.name);
    setValStr(attr.values?.map((v: any) => v.value).join(', ') ?? '');
    setEditing(false);
  };

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '12px 16px', width: '200px' }}>
          {editing ? (
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 'var(--radius)',
                border: '1px solid var(--accent)', background: 'var(--bg-base)',
                color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
              }}
            />
          ) : (
            <span style={{ fontWeight: 600 }}>{attr.name}</span>
          )}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {editing ? (
            <input
              value={valStr}
              onChange={e => setValStr(e.target.value)}
              placeholder="S, M, L, XL"
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 'var(--radius)',
                border: '1px solid var(--accent)', background: 'var(--bg-base)',
                color: 'var(--text-primary)', fontSize: '14px', outline: 'none'
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {attr.values?.map((v: any) => (
                <span key={v.id} style={{
                  padding: '2px 8px', borderRadius: '99px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  fontSize: '12px', color: 'var(--text-secondary)'
                }}>
                  {v.value}
                </span>
              ))}
            </div>
          )}
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AttributesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  // ── Queries ──
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
  const { data: priceLists, isLoading: loadingPrices } = useQuery({
    queryKey: ['price-lists'],
    queryFn: () => productsApi.getPriceLists(),
  });

  // ── New item form state ──
  const [newName, setNewName] = useState('');
  const [newExtra, setNewExtra] = useState('');

  // ── Mutations: Categories ──
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

  // ── Mutations: Brands ──
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

  // ── Mutations: Attributes ──
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

  // ── Mutations: Price Lists ──
  const createPriceMut = useMutation({
    mutationFn: (d: { name: string; margin: number }) => productsApi.createPriceList(d),
    onSuccess: () => { toast.success('Lista creada'); queryClient.invalidateQueries({ queryKey: ['price-lists'] }); resetForm(); }
  });
  const updatePriceMut = useMutation({
    mutationFn: ({ id, name, margin }: { id: string; name: string; margin: number }) =>
      productsApi.updatePriceList(id, { name, margin }),
    onSuccess: () => { toast.success('Lista actualizada'); queryClient.invalidateQueries({ queryKey: ['price-lists'] }); }
  });
  const deletePriceMut = useMutation({
    mutationFn: (id: string) => productsApi.deletePriceList(id),
    onSuccess: () => { toast.success('Lista eliminada'); queryClient.invalidateQueries({ queryKey: ['price-lists'] }); }
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
    } else if (activeTab === 'price-lists') {
      const margin = parseFloat(newExtra);
      if (!margin || margin <= 0) { toast.error('Margen inválido'); return; }
      createPriceMut.mutate({ name: newName, margin: 1 + margin / 100 });
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'categories', label: 'Categorías', icon: <Layers size={15} /> },
    { key: 'brands', label: 'Marcas', icon: <Tag size={15} /> },
    { key: 'attributes', label: 'Atributos', icon: <List size={15} /> },
    { key: 'price-lists', label: 'Listas de Precios', icon: <DollarSign size={15} /> },
  ];

  const isLoading =
    (activeTab === 'categories' && loadingCats) ||
    (activeTab === 'brands' && loadingBrands) ||
    (activeTab === 'attributes' && loadingAttrs) ||
    (activeTab === 'price-lists' && loadingPrices);

  return (
    <PageContainer
      title="Taxonomía y Precios"
      subtitle="Gestioná categorías, marcas, atributos y listas de precios."
    >
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius)', width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); resetForm(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: 'var(--radius)',
              border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
              background: activeTab === t.key ? 'var(--bg-base)' : 'transparent',
              color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === t.key ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* ── Create Form ── */}
        <Section title={`Nuevo${activeTab === 'categories' ? 'a Categoría' : activeTab === 'brands' ? 'a Marca' : activeTab === 'attributes' ? ' Atributo' : 'a Lista'}`}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Nombre *"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={
                activeTab === 'categories' ? 'Ej: Remeras' :
                activeTab === 'brands' ? 'Ej: Nike' :
                activeTab === 'attributes' ? 'Ej: Talle' : 'Ej: Minorista'
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
            {activeTab === 'price-lists' && (
              <>
                <Input
                  label="Margen de Ganancia (%) *"
                  type="number"
                  value={newExtra}
                  onChange={e => setNewExtra(e.target.value)}
                  placeholder="50"
                />
                {newExtra && parseFloat(newExtra) > 0 && (
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '8px', borderRadius: 'var(--radius)' }}>
                    💡 Costo $1000 → Precio de venta <strong>${(1000 * (1 + parseFloat(newExtra) / 100)).toFixed(0)}</strong>
                  </p>
                )}
              </>
            )}
            <Button type="submit" variant="primary" icon={<Plus size={15} />}>
              Crear
            </Button>
          </form>
        </Section>

        {/* ── List ── */}
        <Section title={`${tabs.find(t => t.key === activeTab)?.label} configuradas`}>
          {isLoading ? <TableSkeleton rows={5} /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</th>
                    {activeTab === 'attributes' && (
                      <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valores</th>
                    )}
                    {activeTab === 'price-lists' && (
                      <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Margen</th>
                    )}
                    {activeTab === 'categories' && (
                      <th style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría Padre</th>
                    )}
                    <th style={{ padding: '10px 16px', width: '120px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Categories */}
                  {activeTab === 'categories' && categories?.map(cat => (
                    <InlineEditRow
                      key={cat.id}
                      label={cat.name}
                      extraLabel="Categoría Padre"
                      extraValue={(cat as any).parent?.name ?? ''}
                      onSave={(name) => updateCatMut.mutate({ id: cat.id, name })}
                      onDelete={() => deleteCatMut.mutate(cat.id)}
                    />
                  ))}
                  {/* Brands */}
                  {activeTab === 'brands' && brands?.map(brand => (
                    <InlineEditRow
                      key={brand.id}
                      label={brand.name}
                      onSave={(name) => updateBrandMut.mutate({ id: brand.id, name })}
                      onDelete={() => deleteBrandMut.mutate(brand.id)}
                    />
                  ))}
                  {/* Attributes */}
                  {activeTab === 'attributes' && attributes?.map(attr => (
                    <AttributeRow
                      key={attr.id}
                      attr={attr}
                      onSave={(id, name, values) => updateAttrMut.mutate({ id, name, values })}
                      onDelete={(id) => deleteAttrMut.mutate(id)}
                    />
                  ))}
                  {/* Price Lists */}
                  {activeTab === 'price-lists' && priceLists?.map(pl => (
                    <PriceListRow
                      key={pl.id}
                      pl={pl}
                      onSave={(id, name, margin) => updatePriceMut.mutate({ id, name, margin })}
                      onDelete={(id) => deletePriceMut.mutate(id)}
                    />
                  ))}
                </tbody>
              </table>

              {/* Empty states */}
              {activeTab === 'categories' && categories?.length === 0 && <EmptyState title="No hay categorías" icon={<Layers size={32} />} />}
              {activeTab === 'brands' && brands?.length === 0 && <EmptyState title="No hay marcas" icon={<Tag size={32} />} />}
              {activeTab === 'attributes' && attributes?.length === 0 && <EmptyState title="No hay atributos" icon={<List size={32} />} />}
              {activeTab === 'price-lists' && priceLists?.length === 0 && <EmptyState title="No hay listas de precios" icon={<DollarSign size={32} />} />}
            </div>
          )}
        </Section>
      </div>
    </PageContainer>
  );
}

// ─── Price List Row (special: margin %) ──────────────────────────────────────
function PriceListRow({ pl, onSave, onDelete }: {
  pl: any;
  onSave: (id: string, name: string, margin: number) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(pl.name);
  const [marginPct, setMarginPct] = useState(String(Math.round((pl.margin - 1) * 100)));
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    if (!name.trim() || !marginPct) return;
    onSave(pl.id, name.trim(), 1 + parseFloat(marginPct) / 100);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(pl.name);
    setMarginPct(String(Math.round((pl.margin - 1) * 100)));
    setEditing(false);
  };

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        <td style={{ padding: '12px 16px' }}>
          {editing ? (
            <input value={name} onChange={e => setName(e.target.value)} autoFocus
              style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--accent)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
          ) : (
            <span style={{ fontWeight: 600 }}>{pl.name}</span>
          )}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input type="number" value={marginPct} onChange={e => setMarginPct(e.target.value)}
                style={{ width: '80px', padding: '6px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--accent)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }} />
              <span style={{ color: 'var(--text-secondary)' }}>%</span>
            </div>
          ) : (
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>+{Math.round((pl.margin - 1) * 100)}%</span>
          )}
        </td>
        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
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
        title="Eliminar Lista"
        message={`¿Eliminar la lista "${pl.name}"?`}
        confirmLabel="Eliminar"
        variant="danger"
        onConfirm={() => { onDelete(pl.id); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
