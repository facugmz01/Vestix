import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Tag, List, Pencil, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

import { CATALOG_TABS } from '@/navigation/moduleTabs';
import {
  PageContainer, Section, Button, Badge, SearchInput, FiltersBar,
  EmptyState, TableSkeleton, ConfirmDialog, Tabs, Table, ApiErrorDisplay,
} from '@/components/ui';
import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';
import { ActionGuard } from '@/rbac/ActionGuard';
import type { Attribute, Brand, Category } from '@/types';
import {
  TaxonomyFormDrawer,
  type TaxonomyKind,
} from '@/features/catalog/components/TaxonomyFormDrawer';
import adminStyles from '@/styles/AdminListShared.module.css';
import styles from './AttributesPage.module.css';

type DeleteTarget =
  | { kind: 'categories'; item: Category }
  | { kind: 'brands'; item: Brand }
  | { kind: 'attributes'; item: Attribute };

const TAB_META: { key: TaxonomyKind; label: string; icon: typeof Layers }[] = [
  { key: 'categories', label: 'Categorías', icon: Layers },
  { key: 'brands', label: 'Marcas', icon: Tag },
  { key: 'attributes', label: 'Atributos', icon: List },
];

export default function AttributesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TaxonomyKind>('categories');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editBrand, setEditBrand] = useState<Brand | null>(null);
  const [editAttribute, setEditAttribute] = useState<Attribute | null>(null);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => productsApi.getCategories(),
    enabled: activeTab === 'categories',
  });
  const brandsQuery = useQuery({
    queryKey: queryKeys.brands.all(),
    queryFn: () => productsApi.getBrands(),
    enabled: activeTab === 'brands',
  });
  const attributesQuery = useQuery({
    queryKey: queryKeys.attributes.all(),
    queryFn: () => productsApi.getAttributes(),
    enabled: activeTab === 'attributes',
  });

  const activeQuery =
    activeTab === 'categories' ? categoriesQuery
    : activeTab === 'brands' ? brandsQuery
    : attributesQuery;

  const q = search.trim().toLowerCase();

  const categories = useMemo(() => {
    const rows = categoriesQuery.data ?? [];
    if (!q) return rows;
    return rows.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.parent?.name ?? '').toLowerCase().includes(q),
    );
  }, [categoriesQuery.data, q]);

  const brands = useMemo(() => {
    const rows = brandsQuery.data ?? [];
    if (!q) return rows;
    return rows.filter((b) => b.name.toLowerCase().includes(q));
  }, [brandsQuery.data, q]);

  const attributes = useMemo(() => {
    const rows = attributesQuery.data ?? [];
    if (!q) return rows;
    return rows.filter((a) =>
      a.name.toLowerCase().includes(q) ||
      a.values?.some((v) => v.value.toLowerCase().includes(q)),
    );
  }, [attributesQuery.data, q]);

  const count =
    activeTab === 'categories' ? categories.length
    : activeTab === 'brands' ? brands.length
    : attributes.length;

  const deleteMutation = useMutation({
    mutationFn: async (target: DeleteTarget) => {
      if (target.kind === 'categories') return productsApi.deleteCategory(target.item.id);
      if (target.kind === 'brands') return productsApi.deleteBrand(target.item.id);
      return productsApi.deleteAttribute(target.item.id);
    },
    onSuccess: (_data, target) => {
      const messages = {
        categories: 'Categoría eliminada',
        brands: 'Marca eliminada',
        attributes: 'Atributo eliminado',
      };
      toast.success(messages[target.kind]);
      if (target.kind === 'categories') queryClient.invalidateQueries({ queryKey: queryKeys.categories.all() });
      else if (target.kind === 'brands') queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() });
      else queryClient.invalidateQueries({ queryKey: queryKeys.attributes.all() });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'No se pudo eliminar'),
  });

  const openCreate = () => {
    setEditCategory(null);
    setEditBrand(null);
    setEditAttribute(null);
    setFormOpen(true);
  };

  const openEditCategory = (item: Category) => {
    setEditCategory(item);
    setEditBrand(null);
    setEditAttribute(null);
    setFormOpen(true);
  };

  const openEditBrand = (item: Brand) => {
    setEditBrand(item);
    setEditCategory(null);
    setEditAttribute(null);
    setFormOpen(true);
  };

  const openEditAttribute = (item: Attribute) => {
    setEditAttribute(item);
    setEditCategory(null);
    setEditBrand(null);
    setFormOpen(true);
  };

  const switchTab = (key: TaxonomyKind) => {
    setActiveTab(key);
    setSearch('');
  };

  const createLabels = {
    categories: 'Nueva categoría',
    brands: 'Nueva marca',
    attributes: 'Nuevo atributo',
  };

  const searchPlaceholders = {
    categories: 'Buscar categoría o padre…',
    brands: 'Buscar marca…',
    attributes: 'Buscar atributo o valor…',
  };

  const emptyCopy = {
    categories: { title: 'No hay categorías', message: 'Creá categorías para organizar el catálogo de productos.' },
    brands: { title: 'No hay marcas', message: 'Agregá marcas para filtrar y etiquetar productos.' },
    attributes: { title: 'No hay atributos', message: 'Definí talles, colores u otras variantes de productos.' },
  };

  return (
    <PageContainer
      tabs={<Tabs items={CATALOG_TABS} />}
      title="Categorías y Atributos"
      subtitle="Taxonomía del catálogo: categorías, marcas y atributos de variantes."
      action={
        <ActionGuard action="manage" subject="Catalog">
          <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate}>
            {createLabels[activeTab]}
          </Button>
        </ActionGuard>
      }
    >
      <div className={styles.tabBar} role="tablist" aria-label="Tipo de taxonomía">
        {TAB_META.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              onClick={() => switchTab(t.key)}
              className={clsx(styles.tabBtn, activeTab === t.key && styles.tabBtnActive)}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      <FiltersBar actions={<Badge color="gray">{count}</Badge>}>
        <SearchInput
          key={activeTab}
          placeholder={searchPlaceholders[activeTab]}
          onSearch={setSearch}
        />
      </FiltersBar>

      <Section>
        {activeQuery.isLoading ? (
          <TableSkeleton rows={6} />
        ) : activeQuery.error ? (
          <ApiErrorDisplay error={activeQuery.error} onRetry={() => activeQuery.refetch()} />
        ) : count === 0 ? (
          <EmptyState
            icon={
              activeTab === 'categories' ? <Layers size={40} />
              : activeTab === 'brands' ? <Tag size={40} />
              : <List size={40} />
            }
            title={emptyCopy[activeTab].title}
            message={emptyCopy[activeTab].message}
          />
        ) : activeTab === 'categories' ? (
          <Table
            keyField="id"
            data={categories}
            columns={[
              {
                key: 'name',
                header: 'Nombre',
                render: (c) => (
                  <div className={adminStyles.cellStackGapXs}>
                    <span className={adminStyles.cellPrimary}>{c.name}</span>
                    {c.parentId && (
                      <span className={adminStyles.cellMuted}>Subcategoría</span>
                    )}
                  </div>
                ),
              },
              {
                key: 'parent',
                header: 'Categoría padre',
                render: (c) => (
                  <span className={adminStyles.cellSecondaryMuted}>
                    {c.parent?.name ?? '—'}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: '',
                width: '120px',
                render: (c) => (
                  <div className={adminStyles.rowActions}>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil size={14} />}
                        onClick={() => openEditCategory(c)}
                        aria-label="Editar"
                      />
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => setDeleteTarget({ kind: 'categories', item: c })}
                        aria-label="Eliminar"
                      />
                    </ActionGuard>
                  </div>
                ),
              },
            ]}
          />
        ) : activeTab === 'brands' ? (
          <Table
            keyField="id"
            data={brands}
            columns={[
              {
                key: 'name',
                header: 'Nombre',
                render: (b) => <span className={adminStyles.cellPrimary}>{b.name}</span>,
              },
              {
                key: 'actions',
                header: '',
                width: '120px',
                render: (b) => (
                  <div className={adminStyles.rowActions}>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil size={14} />}
                        onClick={() => openEditBrand(b)}
                        aria-label="Editar"
                      />
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => setDeleteTarget({ kind: 'brands', item: b })}
                        aria-label="Eliminar"
                      />
                    </ActionGuard>
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <Table
            keyField="id"
            data={attributes}
            columns={[
              {
                key: 'name',
                header: 'Atributo',
                width: '200px',
                render: (a) => <span className={adminStyles.cellPrimary}>{a.name}</span>,
              },
              {
                key: 'values',
                header: 'Valores',
                render: (a) => (
                  <div className={styles.chipRow}>
                    {a.values?.length
                      ? a.values.map((v) => (
                          <span key={v.id} className={styles.chip}>{v.value}</span>
                        ))
                      : <span className={adminStyles.cellMuted}>Sin valores</span>}
                  </div>
                ),
              },
              {
                key: 'actions',
                header: '',
                width: '120px',
                render: (a) => (
                  <div className={adminStyles.rowActions}>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil size={14} />}
                        onClick={() => openEditAttribute(a)}
                        aria-label="Editar"
                      />
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => setDeleteTarget({ kind: 'attributes', item: a })}
                        aria-label="Eliminar"
                      />
                    </ActionGuard>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Section>

      <TaxonomyFormDrawer
        open={formOpen}
        kind={activeTab}
        onClose={() => setFormOpen(false)}
        categoryToEdit={editCategory}
        brandToEdit={editBrand}
        attributeToEdit={editAttribute}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={
          deleteTarget?.kind === 'attributes' ? 'Eliminar atributo'
          : deleteTarget?.kind === 'brands' ? 'Eliminar marca'
          : 'Eliminar categoría'
        }
        message={`¿Eliminar "${deleteTarget?.item.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  );
}
