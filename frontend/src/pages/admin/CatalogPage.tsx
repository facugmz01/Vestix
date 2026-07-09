import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Package, LayoutGrid, List,
  Edit2, Trash2, Tag, Globe, Archive, Copy, ImageIcon
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import {
  PageContainer, Tabs, Pagination, EmptyState, ApiErrorDisplay,
  TableSkeleton, ConfirmDialog, SearchInput, Button
} from '@/components/ui';

import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';
import type { Product } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { ProductDetailDrawer } from '@/features/products/components/ProductDetailDrawer';
import { ProductTable } from '@/features/products/components/ProductTable';
import { ImportProductsModal } from '@/features/products/components/ImportProductsModal';
import { BulkPriceUpdaterModal } from '@/features/products/components/BulkPriceUpdaterModal';
import styles from './CatalogPage.module.css';

function StatusPill({ isActive, isPublished }: { isActive: boolean; isPublished: boolean }) {
  if (!isActive) {
    return (
      <span className={clsx(styles.pill, styles.pillInactive)}>
        <Archive size={10} /> Inactivo
      </span>
    );
  }
  if (isPublished) {
    return (
      <span className={clsx(styles.pill, styles.pillPublished)}>
        <Globe size={10} /> Publicado
      </span>
    );
  }
  return (
    <span className={clsx(styles.pill, styles.pillDraft)}>
      <Tag size={10} /> Borrador
    </span>
  );
}

function ProductCard({ product, onView, onEdit, onDelete, onDuplicate }: {
  product: Product;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onDuplicate?: (p: Product) => void;
}) {
  const cat = (product as any).category?.name || '—';

  return (
    <div className={styles.card} onClick={() => onView(product)}>
      <div className={styles.cardImage}>
        {product.images && product.images.length > 0 ? (
          <img src={product.images[0]} alt={product.name} className={styles.cardImg} />
        ) : (
          <div className={styles.cardPlaceholder}>
            <Package size={36} />
          </div>
        )}

        <div className={styles.cardActions}>
          <ActionGuard action="create" subject="Catalog">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDuplicate?.(product); }}
              className={styles.cardActionBtn}
              title="Duplicar"
            >
              <Copy size={13} />
            </button>
          </ActionGuard>
          <ActionGuard action="manage" subject="Catalog">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(product); }}
              className={styles.cardActionBtn}
              title="Editar"
            >
              <Edit2 size={13} />
            </button>
          </ActionGuard>
          <ActionGuard action="manage" subject="Catalog">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(product); }}
              className={clsx(styles.cardActionBtn, styles.cardActionBtnDanger)}
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </ActionGuard>
        </div>
      </div>

      <div className={styles.cardBody}>
        <p className={styles.cardName}>{product.name}</p>
        <p className={styles.cardCategory}>
          <Tag size={11} /> {cat}
        </p>
        <div className={styles.cardFooter}>
          <StatusPill isActive={product.isActive} isPublished={product.isPublished} />
          {product.basePrice != null && (
            <span className={styles.cardPrice}>
              ${product.basePrice.toLocaleString('es-AR')}
            </span>
          )}
        </div>
      </div>

      {product.variants && product.variants.length > 0 && (
        <div className={styles.variantChip}>
          {product.variants.length} variantes
        </div>
      )}
    </div>
  );
}

function SummaryBar({ products, globalTotal }: { products: Product[]; globalTotal: number }) {
  const active = products.filter(p => p.isActive).length;
  const published = products.filter(p => p.isPublished).length;
  const inactive = products.filter(p => !p.isActive).length;

  const stats = [
    { label: 'Total (Todos)', value: globalTotal, valueClass: styles.statValueAccent, boxClass: styles.statAccent },
    { label: 'Activos (en esta pág)', value: active, valueClass: styles.statValueGreen, boxClass: styles.statGreen },
    { label: 'Publicados (en esta pág)', value: published, valueClass: styles.statValueBlue, boxClass: styles.statBlue },
    { label: 'Inactivos (en esta pág)', value: inactive, valueClass: styles.statValueMuted, boxClass: styles.statMuted },
  ];

  return (
    <div className={styles.summary}>
      {stats.map(s => (
        <div key={s.label} className={clsx(styles.stat, s.boxClass)}>
          <span className={clsx(styles.statValue, s.valueClass)}>{s.value}</span>
          <span className={styles.statLabel}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function CatalogPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize] = useState(24);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [bulkUpdaterOpen, setBulkUpdaterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const apiFilters = {
    page, pageSize, search, categoryId,
    isActive: statusFilter === 'ACTIVE' || statusFilter === 'PUBLISHED' ? true : statusFilter === 'INACTIVE' ? false : undefined,
    isPublished: statusFilter === 'PUBLISHED' ? true : undefined,
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.products.all(apiFilters),
    queryFn: () => productsApi.getProducts(apiFilters),
  });

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => productsApi.getCategories(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      toast.success('Producto eliminado');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar. Verificá que no tenga stock o facturas vinculadas.');
    },
  });

  const clearCatalogMutation = useMutation({
    mutationFn: () => productsApi.clearCatalog(),
    onSuccess: () => {
      toast.success('Catálogo vaciado con éxito');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      setClearDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al vaciar el catálogo.');
    },
  });

  const publishAllMutation = useMutation({
    mutationFn: () => productsApi.publishAll(),
    onSuccess: (data) => {
      toast.success(`¡${data.count} productos publicados con éxito!`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al publicar los productos.');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => productsApi.duplicateProduct(id),
    onSuccess: (product) => {
      toast.success('Producto duplicado');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      navigate(`/admin/catalog/${product.id}/edit`);
    },
    onError: (err: any) => toast.error(err.message || 'Error al duplicar'),
  });

  const migrateImagesMutation = useMutation({
    mutationFn: () => productsApi.migrateBase64Images(),
    onSuccess: (res) => {
      toast.success(`Migradas ${res.migratedImages} imágenes en ${res.migratedProducts} productos`);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
    },
    onError: (err: any) => toast.error(err.message || 'Error en migración'),
  });

  const products = Array.isArray(data) ? data : (data?.data ?? []);
  const total = Array.isArray(data) ? data.length : (data?.total ?? 0);

  const handleEdit = (p: Product) => { navigate(`/admin/catalog/${p.id}/edit`); };
  const handleView = (p: Product) => { setDetailProduct(p); };
  const handleDeletePrompt = (p: Product) => { setSelectedProduct(p); setDeleteOpen(true); };
  const handleDuplicate = (p: Product) => duplicateMutation.mutate(p.id);

  return (
    <PageContainer
      tabs={<Tabs items={CATALOG_TABS} />}
      title="Catálogo Maestro"
      subtitle="Gestioná los productos base, su categorización y publicación en el e-commerce."
      action={
        <div className={styles.toolbar}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={clsx(styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive)}
              title="Vista grilla"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={clsx(styles.viewBtn, viewMode === 'list' && styles.viewBtnActive)}
              title="Vista lista"
            >
              <List size={16} />
            </button>
          </div>

          <ActionGuard action="update" subject="Catalog">
            <div className={styles.toolGroup}>
              <button type="button" onClick={() => setBulkUpdaterOpen(true)} className={styles.toolBtn}>
                Actualización Masiva
              </button>
              <button
                type="button"
                onClick={() => migrateImagesMutation.mutate()}
                disabled={migrateImagesMutation.isPending}
                className={styles.toolBtn}
              >
                <ImageIcon size={15} /> Migrar imágenes
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que querés publicar todos los productos en el ecommerce?')) {
                    publishAllMutation.mutate();
                  }
                }}
                className={clsx(styles.toolBtn, styles.toolBtnInfo)}
                disabled={publishAllMutation.isPending}
              >
                <Globe size={15} /> Publicar Todos
              </button>
            </div>
          </ActionGuard>

          <ActionGuard action="delete" subject="Catalog">
            <button type="button" onClick={() => setClearDialogOpen(true)} className={clsx(styles.toolBtn, styles.toolBtnDanger)}>
              <Trash2 size={15} /> Vaciar Catálogo
            </button>
          </ActionGuard>

          <ActionGuard action="create" subject="Catalog">
            <div className={styles.toolGroup}>
              <button type="button" onClick={() => setImportOpen(true)} className={styles.toolBtn}>
                <Package size={15} /> Importar CSV
              </button>
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/admin/catalog/new')}>
                Nuevo Producto
              </Button>
            </div>
          </ActionGuard>
        </div>
      }
    >
      <div className={styles.filters}>
        <div className={styles.searchGrow}>
          <SearchInput
            placeholder="Buscar por nombre..."
            onSearch={(v) => { setSearch(v); setPage(1); }}
            value={search}
          />
        </div>

        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className={styles.select}
        >
          <option value="">Todas las Categorías</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className={styles.select}
        >
          <option value="">Todos los Estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="PUBLISHED">Publicados (Web)</option>
          <option value="INACTIVE">Inactivos / Archivados</option>
        </select>

        <span className={styles.totalCount}>{total} productos</span>
      </div>

      {!isLoading && !error && products.length > 0 && (
        <SummaryBar products={products} globalTotal={total} />
      )}

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : error ? (
        <ApiErrorDisplay error={error} onRetry={refetch} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package size={40} />}
          title="Catálogo vacío"
          message="Creá productos madre para luego poder asignarles talles, colores y precios."
        />
      ) : viewMode === 'grid' ? (
        <div className={styles.grid}>
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeletePrompt}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      ) : (
        <div className={styles.listWrap}>
          <ProductTable
            products={products}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
          />
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      {detailProduct && (
        <ProductDetailDrawer
          open={!!detailProduct}
          onClose={() => setDetailProduct(null)}
          product={detailProduct}
        />
      )}
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Producto Madre"
        message={`¿Estás seguro de que querés eliminar "${selectedProduct?.name}"? Esta acción borrará todas sus variantes asociadas. Fallará si ya existen movimientos de stock o facturas vinculadas a sus SKUs.`}
        confirmLabel="Eliminar Definitivamente"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedProduct && deleteMutation.mutate(selectedProduct.id)}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={clearDialogOpen}
        title="Vaciar Catálogo"
        message="Esta acción elimina productos, variantes, categorías, marcas y listas de precios del catálogo. No borra ventas ni finanzas, pero requiere que no haya stock ni cotizaciones abiertas. Escribí VACIAR para confirmar."
        confirmLabel="Vaciar Catálogo"
        variant="danger"
        loading={clearCatalogMutation.isPending}
        onConfirm={() => {
          if (clearConfirmText !== 'VACIAR') {
            toast.error('Debés escribir VACIAR para confirmar');
            return;
          }
          clearCatalogMutation.mutate();
          setClearConfirmText('');
        }}
        onCancel={() => { setClearDialogOpen(false); setClearConfirmText(''); }}
      />
      {clearDialogOpen && (
        <div className={styles.clearConfirm}>
          <input
            type="text"
            placeholder="Escribí VACIAR"
            value={clearConfirmText}
            onChange={e => setClearConfirmText(e.target.value)}
            className={styles.clearInput}
          />
        </div>
      )}

      <ImportProductsModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          refetch();
        }}
      />

      {bulkUpdaterOpen && (
        <BulkPriceUpdaterModal
          open={bulkUpdaterOpen}
          onClose={() => setBulkUpdaterOpen(false)}
        />
      )}
    </PageContainer>
  );
}
