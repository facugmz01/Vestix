import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Package, LayoutGrid, List,
  Edit2, Trash2, Tag, Globe, Archive
} from 'lucide-react';
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

// ── Status Badge ────────────────────────────────────────────────────────────
function StatusPill({ isActive, isPublished }: { isActive: boolean; isPublished: boolean }) {
  if (!isActive) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: 'rgba(107,114,128,0.15)', color: '#6b7280', border: '1px solid rgba(107,114,128,0.2)' }}>
      <Archive size={10} /> Inactivo
    </span>
  );
  if (isPublished) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
      <Globe size={10} /> Publicado
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 600, background: 'rgba(234,179,8,0.12)', color: '#eab308', border: '1px solid rgba(234,179,8,0.25)' }}>
      <Tag size={10} /> Borrador
    </span>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onView, onEdit, onDelete }: {
  product: Product;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const cat = (product as any).category?.name || '—';

  return (
    <div
      className="glass-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onView(product)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'none',
      }}
    >
      {/* Image area */}
      <div style={{
        height: '140px',
        background: 'var(--bg-surface-hover)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Package size={36} color="rgba(99,102,241,0.3)" />
          </div>
        )}

        {/* Floating action buttons on hover */}
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          display: 'flex', gap: '6px',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'all 0.2s ease',
        }}>
          <ActionGuard action="manage" subject="Catalog">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(product); }}
              style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', background: 'rgba(26,30,42,0.9)', backdropFilter: 'blur(8px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              title="Editar"
            >
              <Edit2 size={13} />
            </button>
          </ActionGuard>
          <ActionGuard action="manage" subject="Catalog">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(product); }}
              style={{ width: '30px', height: '30px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(8px)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
              title="Eliminar"
            >
              <Trash2 size={13} />
            </button>
          </ActionGuard>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '6px' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.3, flex: 1 }}>
            {product.name}
          </p>
        </div>

        <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Tag size={11} /> {cat}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <StatusPill isActive={product.isActive} isPublished={product.isPublished} />
          {product.basePrice != null && (
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green)' }}>
              ${product.basePrice.toLocaleString('es-AR')}
            </span>
          )}
        </div>
      </div>

      {/* Variants count chip */}
      {product.variants && product.variants.length > 0 && (
        <div style={{
          position: 'absolute', top: '8px', left: '8px',
          background: 'rgba(26,30,42,0.85)', backdropFilter: 'blur(8px)',
          borderRadius: '8px', padding: '3px 8px',
          fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)',
        }}>
          {product.variants.length} variantes
        </div>
      )}
    </div>
  );
}

// ── Summary Stats ────────────────────────────────────────────────────────────
function SummaryBar({ products, globalTotal }: { products: Product[], globalTotal: number }) {
  const active = products.filter(p => p.isActive).length;
  const published = products.filter(p => p.isPublished).length;
  const inactive = products.filter(p => !p.isActive).length;

  const stats = [
    { label: 'Total (Todos)', value: globalTotal, color: 'var(--accent)', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Activos (en esta pág)', value: active, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Publicados (en esta pág)', value: published, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
    { label: 'Inactivos (en esta pág)', value: inactive, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
  ];

  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
      {stats.map(s => (
        <div key={s.label} style={{
          flex: '1 1 100px', minWidth: '100px',
          background: s.bg,
          border: `1px solid ${s.color}30`,
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex', flexDirection: 'column', gap: '4px',
        }}>
          <span style={{ fontSize: '22px', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
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

  const products = Array.isArray(data) ? data : (data?.data ?? []);
  const total = Array.isArray(data) ? data.length : (data?.total ?? 0);

  const handleEdit = (p: Product) => { navigate(`/admin/catalog/${p.id}/edit`); };
  const handleView = (p: Product) => { setDetailProduct(p); };
  const handleDeletePrompt = (p: Product) => { setSelectedProduct(p); setDeleteOpen(true); };

  return (
    <PageContainer
      tabs={<Tabs items={CATALOG_TABS} />}
      title="Catálogo Maestro"
      subtitle="Gestioná los productos base, su categorización y publicación en el e-commerce."
      action={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>

          {/* View mode toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0 }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{ padding: '8px 12px', border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? 'var(--accent)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
              title="Vista grilla"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{ padding: '8px 12px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? 'var(--accent)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
              title="Vista lista"
            >
              <List size={16} />
            </button>
          </div>

          <ActionGuard action="update" subject="Catalog">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setBulkUpdaterOpen(true)}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', padding: '8px 14px', borderRadius: 'var(--radius)',
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                Actualización Masiva
              </button>
              <button
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que querés publicar todos los productos en el ecommerce?')) {
                    publishAllMutation.mutate();
                  }
                }}
                style={{
                  background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)',
                  color: '#0ea5e9', padding: '8px 14px', borderRadius: 'var(--radius)',
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0,
                }}
                disabled={publishAllMutation.isPending}
              >
                <Globe size={15} /> Publicar Todos
              </button>
            </div>
          </ActionGuard>

          <ActionGuard action="delete" subject="Catalog">
            <button
              onClick={() => setClearDialogOpen(true)}
              style={{
                background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444', padding: '8px 14px', borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                fontWeight: 500, fontSize: '13px', transition: 'all 0.2s',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
            >
              <Trash2 size={15} /> Vaciar Catálogo
            </button>
          </ActionGuard>

          <ActionGuard action="create" subject="Catalog">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setImportOpen(true)}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', padding: '8px 14px', borderRadius: 'var(--radius)',
                  display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                  fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
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
      {/* ── Filters bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '12px', alignItems: 'center',
        marginBottom: '20px', flexWrap: 'wrap',
        padding: '14px 16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ flex: '1 1 220px' }}>
          <SearchInput
            placeholder="Buscar por nombre..."
            onSearch={(v) => { setSearch(v); setPage(1); }}
            value={search}
          />
        </div>

        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
        >
          <option value="">Todas las Categorías</option>
          {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
        >
          <option value="">Todos los Estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="PUBLISHED">Publicados (Web)</option>
          <option value="INACTIVE">Inactivos / Archivados</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {total} productos
        </span>
      </div>

      {/* ── Summary stats ───────────────────────────────────────────────────── */}
      {!isLoading && !error && products.length > 0 && (
        <SummaryBar products={products} globalTotal={total} />
      )}

      {/* ── Content ─────────────────────────────────────────────────────────── */}
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
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDeletePrompt}
            />
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: '24px', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', backdropFilter: 'blur(8px)' }}>
          <ProductTable
            products={products}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
          />
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      {/* Drawers */}
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
        title="Vaciar Catálogo Completo"
        message="¿Estás seguro de que querés vaciar el catálogo? Esta acción eliminará definitivamente TODOS los productos, variantes, categorías, marcas, stock y registros de ventas/compras de prueba. Esta acción no se puede deshacer."
        confirmLabel="Vaciar Catálogo Definitivamente"
        variant="danger"
        loading={clearCatalogMutation.isPending}
        onConfirm={() => clearCatalogMutation.mutate()}
        onCancel={() => setClearDialogOpen(false)}
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
    </PageContainer>
  );
}
