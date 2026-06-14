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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onView(product)}
      style={{
        position: 'relative',
        background: hovered
          ? 'rgba(99,102,241,0.06)'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
        borderRadius: '14px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered
          ? '0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.2)'
          : '0 2px 8px rgba(0,0,0,0.15)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Image area */}
      <div style={{
        height: '140px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(168,85,247,0.05) 100%)',
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
function SummaryBar({ products }: { products: Product[] }) {
  const active = products.filter(p => p.isActive).length;
  const published = products.filter(p => p.isPublished).length;
  const inactive = products.filter(p => !p.isActive).length;

  const stats = [
    { label: 'Total', value: products.length, color: 'var(--accent)', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Activos', value: active, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { label: 'Publicados', value: published, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
    { label: 'Inactivos', value: inactive, color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
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
  const [importOpen, setImportOpen] = useState(false);
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{ padding: '7px 12px', border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? 'var(--accent)' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
              title="Vista grilla"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{ padding: '7px 12px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? 'var(--accent)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-muted)', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}
              title="Vista lista"
            >
              <List size={16} />
            </button>
          </div>

          <ActionGuard action="create" subject="Catalog">
            <button
              onClick={() => setImportOpen(true)}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', padding: '8px 16px', borderRadius: 'var(--radius)',
                display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                fontWeight: 500, fontSize: '13px'
              }}
            >
              <Package size={16} /> Importar CSV
            </button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/admin/catalog/new')}>
              Nuevo Producto
            </Button>
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
        <SummaryBar products={products} />
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
          productId={detailProduct.id}
          onEdit={() => {
            navigate(`/admin/catalog/${detailProduct.id}/edit`);
          }}
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
        confirmText="Sí, Eliminar"
        isDestructive
        isLoading={deleteMutation.isPending}
      />

      <ImportProductsModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          refetch();
        }}
      />
    </PageContainer>
  );
}
