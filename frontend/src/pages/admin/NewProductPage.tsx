import { ProductEditor } from '@/features/products/components/ProductEditor';
import { PageContainer } from '@/components/ui';

export default function NewProductPage() {
  return (
    <PageContainer title="Nuevo Producto">
      <ProductEditor />
    </PageContainer>
  );
}
