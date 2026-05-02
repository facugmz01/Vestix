import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  PageContainer, Section, Button, 
  Pagination, EmptyState, 
  ApiErrorDisplay, TableSkeleton, ConfirmDialog
} from '@/components/ui';

import { productsApi } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';
import type { Product } from '@/types';
import { ActionGuard } from '@/rbac/ActionGuard';

import { ProductFormDrawer } from '@/features/products/components/ProductFormDrawer';
import { ProductDetailDrawer } from '@/features/products/components/ProductDetailDrawer';
import { ProductFilters } from '@/features/products/components/ProductFilters';
import { ProductTable } from '@/features/products/components/ProductTable';

export default function CatalogPage() {
  const queryClient = useQueryClient();

  // States
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pageSize] = useState(15);

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Derived API filters
  const apiFilters = {
    page, pageSize, search, categoryId,
    isActive: statusFilter === 'ACTIVE' || statusFilter === 'PUBLISHED' ? true : statusFilter === 'INACTIVE' ? false : undefined,
    isPublished: statusFilter === 'PUBLISHED' ? true : undefined,
  };

  // Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.products.all(apiFilters),
    queryFn: () => productsApi.getProducts(apiFilters),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      toast.success('Producto eliminado');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      setDeleteOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al eliminar producto. Verificá que no tenga variantes con stock o historial.');
    }
  });

  // Handlers
  const handleCreate = () => {
    setSelectedProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormOpen(true);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  const handleDeletePrompt = (product: Product) => {
    setSelectedProduct(product);
    setDeleteOpen(true);
  };

  // Handle both raw array (old/fallback) and PagedResponse (new) formats
  const products = Array.isArray(data) ? data : (data?.data ?? []);
  const total = Array.isArray(data) ? data.length : (data?.total ?? 0);

  return (
    <PageContainer 
      title="Catálogo Maestro" 
      subtitle="Gestioná los productos base, categorización y publicación e-commerce."
      action={
        <ActionGuard action="manage" subject="Catalog">
          <Button variant="primary" icon={<Plus size={16} />} onClick={handleCreate}>
            Nuevo Producto
          </Button>
        </ActionGuard>
      }
    >
      <ProductFilters 
        total={total}
        search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
        categoryId={categoryId} onCategoryChange={(v) => { setCategoryId(v); setPage(1); }}
        statusFilter={statusFilter} onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
      />

      <Section>
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
        ) : (
          <ProductTable 
            products={products}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
          />
        )}
      </Section>

      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />

      {/* Drawers and Modals */}
      <ProductFormDrawer 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        productToEdit={selectedProduct} 
      />
      
      <ProductDetailDrawer 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        product={selectedProduct} 
      />
      
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
    </PageContainer>
  );
}
