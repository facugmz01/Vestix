import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Package, LayoutGrid, List, TableProperties,
  Edit2, Trash2, Tag, Globe, Archive, Copy, ImageIcon,
  Maximize2, X
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

import {
  PageContainer, Tabs, Pagination, EmptyState, ApiErrorDisplay,
  TableSkeleton, ConfirmDialog, SearchInput, Button, SafeImage
} from '@/components/ui';

import { productsApi } from '@/api/products.api';
import { branchesApi } from '@/api/branches.api';
import { priceListsApi } from '@/api/priceLists.api';
import { queryKeys } from '@/api/queryKeys';
import { resolveFirstProductImage } from '@/utils/imageUrl';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Product, PriceList } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { ProductDetailDrawer } from '@/features/products/components/ProductDetailDrawer';
import { ProductTable } from '@/features/products/components/ProductTable';
import { ProductUnifiedTable, calculateVariantPriceInList } from '@/features/products/components/ProductUnifiedTable';
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

function ProductCard({
  product,
  priceLists,
  selectedPriceListId,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onPreviewImage,
}: {
  product: Product;
  priceLists: PriceList[];
  selectedPriceListId?: string;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onDuplicate?: (p: Product) => void;
  onPreviewImage?: (src: string, name: string, sku?: string) => void;
}) {
  const cat = (product as any).category?.name || '—';
  const totalStock = product.totalStock ?? (product.variants || []).reduce((acc, v) => acc + (v.stock?.available ?? 0), 0);
  const imgSrc = resolveFirstProductImage(product.images);
  const firstVariant = product.variants?.[0] || ({
    id: '',
    productId: product.id,
    sku: product.baseSku,
    basePrice: product.basePrice,
    costPrice: product.costPrice,
  } as any);

  // Active price lists to display: if a filter is chosen, show only that one; otherwise show up to 2 active lists
  const activeLists = selectedPriceListId
    ? priceLists.filter(pl => pl.id === selectedPriceListId)
    : priceLists.slice(0, 2);

  return (
    <div className={styles.card} onClick={() => onView(product)}>
      <div className={styles.cardImage}>
        <SafeImage
          src={imgSrc}
          alt={product.name}
          className={styles.cardImg}
          fallback={
            <div className={styles.cardPlaceholder}>
              <Package size={36} />
            </div>
          }
        />

        <div className={styles.cardActions}>
          {imgSrc && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewImage?.(imgSrc, product.name, product.baseSku);
              }}
              className={clsx(styles.cardActionBtn, styles.cardActionBtnZoom)}
              title="Ver imagen en tamaño completo"
              aria-label={`Ver foto de ${product.name}`}
            >
              <Maximize2 size={14} />
            </button>
          )}
          <ActionGuard action="create" subject="Catalog">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDuplicate?.(product); }}
              className={clsx(styles.cardActionBtn, styles.cardActionBtnDuplicate)}
              title="Duplicar producto"
              aria-label={`Duplicar ${product.name}`}
            >
              <Copy size={14} />
            </button>
          </ActionGuard>
          <ActionGuard action="manage" subject="Catalog">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(product); }}
              className={clsx(styles.cardActionBtn, styles.cardActionBtnEdit)}
              title="Editar producto"
              aria-label={`Editar ${product.name}`}
            >
              <Edit2 size={14} />
            </button>
          </ActionGuard>
          <ActionGuard action="manage" subject="Catalog">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(product); }}
              className={clsx(styles.cardActionBtn, styles.cardActionBtnDanger)}
              title="Eliminar producto"
              aria-label={`Eliminar ${product.name}`}
            >
              <Trash2 size={14} />
            </button>
          </ActionGuard>
        </div>
      </div>

      <div className={styles.cardBody}>
        <p className={styles.cardName}>{product.name}</p>
        <p className={styles.cardCategory}>
          <Tag size={11} /> {cat}
        </p>

        <div className={styles.cardPricesRow}>
          {activeLists.length > 0 ? (
            activeLists.map(pl => {
              const { price } = calculateVariantPriceInList(firstVariant, product.basePrice, pl);
              return (
                <div key={pl.id} className={styles.cardPriceListItem}>
                  <span className={styles.cardPriceListLabel}>{pl.name}:</span>
                  <span className={styles.cardPriceListValue}>{formatCurrency(price)}</span>
                </div>
              );
            })
          ) : (
            product.basePrice != null && product.basePrice > 0 ? (
              <span className={styles.cardPrice}>
                Venta: {formatCurrency(product.basePrice)}
              </span>
            ) : null
          )}
          {product.costPrice != null && product.costPrice > 0 ? (
            <span className={styles.cardCost}>
              Costo: {formatCurrency(product.costPrice)}
            </span>
          ) : null}
        </div>

        <div className={styles.cardFooter}>
          <StatusPill isActive={product.isActive} isPublished={product.isPublished} />
          <span className={clsx(
            styles.cardStock,
            totalStock > 5 ? styles.cardStockOk : totalStock > 0 ? styles.cardStockLow : styles.cardStockZero
          )}>
            {totalStock > 0 ? `${totalStock} en stock` : 'Agotado'}
          </span>
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
  const inStock = products.filter(p => (p.totalStock ?? 0) > 0).length;
  const outOfStock = products.filter(p => (p.totalStock ?? 0) === 0).length;
  const totalUnits = products.reduce((acc, p) => acc + (p.totalStock ?? 0), 0);

  const stats = [
    { label: 'Total (Catálogo)', value: globalTotal, valueClass: styles.statValueAccent, boxClass: styles.statAccent },
    { label: 'Con Stock (pág)', value: inStock, valueClass: styles.statValueGreen, boxClass: styles.statGreen },
    { label: 'Sin Stock (pág)', value: outOfStock, valueClass: styles.statValueRed, boxClass: styles.statRed },
    { label: 'Unidades Disp. (pág)', value: totalUnits, valueClass: styles.statValueBlue, boxClass: styles.statBlue },
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
  const [searchParams] = useSearchParams();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [selectedPriceListId, setSelectedPriceListId] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize] = useState(24);
  const [viewMode, setViewMode] = useState<'unified' | 'grid' | 'list'>(() => {
    return (localStorage.getItem('vestix_catalog_view') as any) || 'unified';
  });

  const handleSetViewMode = (mode: 'unified' | 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('vestix_catalog_view', mode);
  };

  useEffect(() => {
    const q = searchParams.get('search');
    if (q != null && q !== search) {
      setSearch(q);
      setPage(1);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkUpdaterOpen, setBulkUpdaterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string; sku?: string } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewImage) {
        setPreviewImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

  const apiFilters = {
    page, pageSize, search, categoryId,
    branchId: branchId || undefined,
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

  const { data: branchesData } = useQuery({
    queryKey: ['branches', 'list'],
    queryFn: () => branchesApi.getBranches({ pageSize: 50 }),
  });

  const { data: priceListsData } = useQuery({
    queryKey: ['price-lists', 'list'],
    queryFn: () => priceListsApi.getPriceLists({ pageSize: 50, isActive: true }),
  });

  const branches = branchesData?.data || [];
  const priceLists: PriceList[] = (priceListsData?.data || []).filter((pl: PriceList) => pl.isActive !== false);
  const selectedPriceList = priceLists.find(pl => pl.id === selectedPriceListId) || null;

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

  const rawProducts = Array.isArray(data) ? data : (data?.data ?? []);
  const total = Array.isArray(data) ? data.length : (data?.total ?? 0);

  // Client-side stock filtering when selected
  const products = rawProducts.filter((p: Product) => {
    const stock = p.totalStock ?? 0;
    if (stockFilter === 'IN_STOCK') return stock > 0;
    if (stockFilter === 'LOW_STOCK') return stock > 0 && stock <= 5;
    if (stockFilter === 'OUT_OF_STOCK') return stock === 0;
    return true;
  });

  const handleEdit = (p: Product) => { navigate(`/admin/catalog/${p.id}/edit`); };
  const handleView = (p: Product) => { setDetailProduct(p); };
  const handleDeletePrompt = (p: Product) => { setSelectedProduct(p); setDeleteOpen(true); };
  const handleDuplicate = (p: Product) => duplicateMutation.mutate(p.id);

  return (
    <PageContainer
      tabs={<Tabs items={CATALOG_TABS} />}
      title="Catálogo Maestro"
      subtitle="Gestioná los productos, variantes, precios y existencias de stock de forma consolidada."
      action={
        <div className={styles.toolbar}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              onClick={() => handleSetViewMode('unified')}
              className={clsx(styles.viewBtn, viewMode === 'unified' && styles.viewBtnActive)}
              title="Vista Unificada (Precios y Stock)"
              aria-label="Vista Unificada (Precios y Stock)"
            >
              <TableProperties size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('grid')}
              className={clsx(styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive)}
              title="Vista Cuadrícula"
              aria-label="Vista Cuadrícula"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleSetViewMode('list')}
              className={clsx(styles.viewBtn, viewMode === 'list' && styles.viewBtnActive)}
              title="Vista Lista simple"
              aria-label="Vista Lista simple"
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
            placeholder="Buscar por nombre, SKU o código de barras..."
            onSearch={(v) => { setSearch(v); setPage(1); }}
            value={search}
          />
        </div>

        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          className={styles.select}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las Categorías</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={branchId}
          onChange={(e) => { setBranchId(e.target.value); setPage(1); }}
          className={styles.select}
          aria-label="Filtrar stock por sucursal"
          title="Sucursal para stock"
        >
          <option value="">Todas las Sucursales</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <select
          value={selectedPriceListId}
          onChange={(e) => setSelectedPriceListId(e.target.value)}
          className={styles.select}
          aria-label="Seleccionar lista de precios"
          title="Lista de precios para visualización"
        >
          <option value="">Todas las Listas de Precios</option>
          {priceLists.map(pl => (
            <option key={pl.id} value={pl.id}>
              Solo {pl.name} {pl.currency ? `(${pl.currency})` : ''}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className={styles.select}
          aria-label="Filtrar por nivel de stock"
        >
          <option value="">Todo el Stock</option>
          <option value="IN_STOCK">Con Stock</option>
          <option value="LOW_STOCK">Stock Bajo (≤ 5)</option>
          <option value="OUT_OF_STOCK">Agotados (0)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className={styles.select}
          aria-label="Filtrar por estado"
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
          title="No se encontraron productos"
          message="Probá cambiando los filtros de búsqueda, categoría, sucursal o stock."
        />
      ) : viewMode === 'unified' ? (
        <ProductUnifiedTable
          products={products}
          priceLists={priceLists}
          selectedPriceListId={selectedPriceListId}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onDuplicate={handleDuplicate}
          onPreviewImage={(src, name, sku) => setPreviewImage({ src, name, sku })}
        />
      ) : viewMode === 'grid' ? (
        <div className={styles.grid}>
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              priceLists={priceLists}
              selectedPriceListId={selectedPriceListId}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeletePrompt}
              onDuplicate={handleDuplicate}
              onPreviewImage={(src, name, sku) => setPreviewImage({ src, name, sku })}
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

      {previewImage && (
        <div
          className={styles.lightbox}
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.lightboxBackdrop} />
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setPreviewImage(null)}
              title="Cerrar (Esc)"
              aria-label="Cerrar vista previa"
            >
              <X size={20} />
            </button>
            <img
              src={previewImage.src}
              alt={previewImage.name}
              className={styles.lightboxImage}
            />
            <div className={styles.lightboxCaption}>
              <h3 className={styles.lightboxTitle}>{previewImage.name}</h3>
              {previewImage.sku && (
                <p className={styles.lightboxSubtitle}>SKU: {previewImage.sku}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
