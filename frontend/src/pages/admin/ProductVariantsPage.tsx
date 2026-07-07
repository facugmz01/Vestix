import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Package, ArrowLeft, Shuffle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, StatusChip
} from '@/components/ui';
import { formatCurrency } from '@/utils/formatCurrency';


import { productsApi } from '@/api/products.api';
import { variantsApi } from '@/api/variants.api';
import { queryKeys } from '@/api/queryKeys';
import type { ProductVariant } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { VariantFormDrawer } from '@/features/variants/components/VariantFormDrawer';
import { VariantDetailDrawer } from '@/features/variants/components/VariantDetailDrawer';
import { VariantGeneratorDrawer } from '@/features/variants/components/VariantGeneratorDrawer';
import { useVariantStockMap } from '@/features/variants/hooks/useVariantStockMap';
import { PrintLabelsModal } from '@/features/variants/components/PrintLabelsModal';
import { BulkPrintLabelsModal } from '@/features/labels/components/BulkPrintLabelsModal';

export default function ProductVariantsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Parent Product Query
  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: queryKeys.products.detail(productId!),
    queryFn: () => productsApi.getProduct(productId!),
    enabled: !!productId,
  });

  // Variants Query
  const { data: variants, isLoading: loadingVariants, error, refetch } = useQuery({
    queryKey: queryKeys.products.variants(productId!),
    queryFn: () => variantsApi.getVariantsByProduct(productId!),
    enabled: !!productId,
  });

  const variantIds = (variants ?? []).map(v => v.id);
  const { stockMap } = useVariantStockMap(variantIds);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => variantsApi.deleteVariant(id),
    onSuccess: () => {
      toast.success('Variante eliminada o desactivada');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.variants(productId!) });
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar variante. Verificá que no tenga stock.');
    }
  });

  const handleCreate = () => {
    setSelectedVariant(null);
    setFormOpen(true);
  };

  const handleEdit = (v: ProductVariant) => {
    setSelectedVariant(v);
    setFormOpen(true);
  };

  const handleView = (v: ProductVariant) => {
    setSelectedVariant(v);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (v: ProductVariant) => {
    setSelectedVariant(v);
    setDeleteOpen(true);
  };

  const handlePrint = (v: ProductVariant) => {
    setSelectedVariant(v);
    setPrintOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!variants) return;
    if (selectedIds.size === variants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(variants.map((v) => v.id)));
    }
  };

  const selectedVariants = (variants ?? []).filter((v) => selectedIds.has(v.id));
  if (loadingProduct) return <PageContainer title="Cargando..."><p style={{ color: 'var(--text-muted)' }}>Cargando producto...</p></PageContainer>;
  if (!product) return <PageContainer title="Producto no encontrado" action={<Button onClick={() => navigate('/admin/catalog')}>Volver</Button>}><p>El producto solicitado no existe.</p></PageContainer>;

  return (
    <PageContainer 
      title={`Variantes: ${product.name}`}
      subtitle="Gestioná los SKUs físicos asociados a este producto base."
      action={
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" icon={<ArrowLeft size={16} />} onClick={() => navigate('/admin/catalog')}>
            Volver
          </Button>
          <ActionGuard action="print" subject="Labels">
            {selectedIds.size > 0 && (
              <Button variant="secondary" icon={<Printer size={16} />} onClick={() => setBulkPrintOpen(true)}>
                Imprimir etiquetas ({selectedIds.size})
              </Button>
            )}
          </ActionGuard>
          <ActionGuard action="manage" subject="Catalog">
            <Button variant="secondary" icon={<Shuffle size={16} />} onClick={() => setGeneratorOpen(true)}>
              Generador Masivo
            </Button>
            <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
              Variante Unitaria
            </Button>
          </ActionGuard>
        </div>
      }
    >
      <Section>
        {loadingVariants ? (
          <TableSkeleton rows={5} />
        ) : error ? (
          <ApiErrorDisplay error={error} onRetry={refetch} />
        ) : !variants || variants.length === 0 ? (
          <EmptyState 
            icon={<Package size={40} />}
            title="Sin Variantes (SKUs)" 
            message="El producto no tiene variantes físicas. Creá una variante única o utilizá el generador masivo para cruzar Talles y Colores." 
          />
        ) : (
          <Table
            keyField="id"
            data={variants}
            columns={[
              {
                key: 'select',
                header: (
                  <input
                    type="checkbox"
                    checked={variants.length > 0 && selectedIds.size === variants.length}
                    onChange={toggleSelectAll}
                    aria-label="Seleccionar todas"
                  />
                ),
                render: (v) => (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(v.id)}
                    onChange={() => toggleSelect(v.id)}
                    aria-label={`Seleccionar ${v.sku}`}
                  />
                ),
              },
              { 
                key: 'sku', 
                header: 'SKU',
                render: (v) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v.sku}</span>
              },
              { 
                key: 'attributes', 
                header: 'Atributos',
                render: (v) => (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {v.color && <Badge color="blue">{v.color}</Badge>}
                    {v.size && <Badge color="purple">{v.size}</Badge>}
                    {!v.color && !v.size && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Única</span>}
                  </div>
                )
              },
              { 
                key: 'barcode', 
                header: 'Cód. Barras',
                render: (v) => <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{v.barcode || '-'}</span>
              },
              {
                key: 'stock',
                header: 'Stock disp.',
                render: (v) => {
                  const stock = stockMap.get(v.id);
                  const qty = stock?.availableQuantity ?? 0;
                  return (
                    <span
                      style={{
                        fontWeight: 600,
                        color: qty > 0 ? 'var(--green)' : qty === 0 ? 'var(--text-muted)' : 'var(--red)',
                      }}
                    >
                      {qty}
                    </span>
                  );
                },
              },
              {
                key: 'price',
                header: 'Precio Base',
                render: (v) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(v.basePrice)}</span>
              },
              { 
                key: 'isActive', 
                header: 'Estado',
                render: (v) => <StatusChip label={v.isActive ? 'Activa' : 'Inactiva'} color={v.isActive ? 'green' : 'gray'} />
              },
              {
                key: 'actions',
                header: '',
                render: (v) => (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <ActionGuard action="print" subject="Labels">
                      <Button variant="ghost" size="sm" onClick={() => handlePrint(v)} aria-label="Imprimir Etiquetas" title="Imprimir etiquetas de código de barras">
                        <Printer size={16} />
                      </Button>
                    </ActionGuard>
                    <Button variant="ghost" size="sm" onClick={() => handleView(v)} aria-label="Ver" title="Ver ficha">
                      <Eye size={16} />
                    </Button>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(v)} aria-label="Editar" title="Editar variante">
                        <Edit2 size={16} />
                      </Button>
                    </ActionGuard>
                    <ActionGuard action="manage" subject="Catalog">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeletePrompt(v)} 
                        aria-label="Eliminar" 
                        title="Eliminar variante"
                      >
                        <Trash2 size={16} color="var(--red)" />
                      </Button>
                    </ActionGuard>
                  </div>
                )
              }
            ]}
          />
        )}
      </Section>

      {/* Overlays */}
      <VariantFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        productId={productId!}
        variantToEdit={selectedVariant} 
      />
      
      <VariantDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        variant={selectedVariant} 
      />

      <VariantGeneratorDrawer
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        productId={productId!}
        defaultBasePrice={variants?.[0]?.basePrice ?? 0}
      />

      <PrintLabelsModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        variant={selectedVariant}
      />

      <BulkPrintLabelsModal
        open={bulkPrintOpen}
        onClose={() => setBulkPrintOpen(false)}
        items={selectedVariants.map((v) => ({
          variantId: v.id,
          sku: v.sku,
          productName: product.name,
          quantity: 1,
        }))}
        title={`Etiquetas: ${selectedVariants.length} variantes`}
      />
      
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar Variante"
        message={`¿Estás seguro de que querés eliminar el SKU "${selectedVariant?.sku}"? Esta acción fallará si la variante tiene historial en ventas o inventario.`}
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => selectedVariant && deleteMutation.mutate(selectedVariant.id)}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}
