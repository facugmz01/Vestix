import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/api/products.api';
import { ProductEditor } from '@/features/products/components/ProductEditor';
import { PageContainer, PageSpinner } from '@/components/ui';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <PageSpinner />;
  }

  if (!product) {
    return <PageContainer title="Error">Producto no encontrado</PageContainer>;
  }

  return (
    <PageContainer title="Editar Producto">
      <ProductEditor initialData={product} />
    </PageContainer>
  );
}
