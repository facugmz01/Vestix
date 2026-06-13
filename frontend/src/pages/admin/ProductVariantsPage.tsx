import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Eye, Package, ArrowLeft, Shuffle } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Table, Button, Badge, EmptyState, ApiErrorDisplay, TableSkeleton, ConfirmDialog, StatusChip
} from '@/components/ui';


import { productsApi } from '@/api/products.api';
import { variantsApi } from '@/api/variants.api';
import { queryKeys } from '@/api/queryKeys';
import type { ProductVariant } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { VariantFormDrawer } from '@/features/variants/components/VariantFormDrawer';
import { VariantDetailDrawer } from '@/features/variants/components/VariantDetailDrawer';
import { VariantGeneratorModal } from '@/features/variants/components/VariantGeneratorModal';
import { PrintLabelsModal } from '@/features/variants/components/PrintLabelsModal';
import { Printer } from 'lucide-react';

export default function ProductVariantsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

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

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => variantsApi.deleteVariant(id),
    onSuccess: () => {
      toast.success('Variante eliminada');
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

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

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
                key: 'price', 
                header: 'Precio Base',
                render: (v) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmtCurrency(v.basePrice)}</span>
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
                    <ActionGuard action="manage" subject="Inventory">
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

      <VariantGeneratorModal
        open={generatorOpen}
        onClose={() => setGeneratorOpen(false)}
        productId={productId!}
      />

      <PrintLabelsModal
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        variant={selectedVariant}
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
