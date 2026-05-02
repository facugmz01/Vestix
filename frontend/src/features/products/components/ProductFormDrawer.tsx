import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Drawer, Button } from '@/components/ui';
import { productsApi, type CreateProductDto } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';
import type { Product } from '@/types';
import toast from 'react-hot-toast';
import { ProductForm } from './ProductForm';

interface Props {
  open: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export function ProductFormDrawer({ open, onClose, productToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!productToEdit;

  // Fetch full product to get existing variants when editing
  const { data: fullProduct } = useQuery({
    queryKey: ['product', productToEdit?.id],
    queryFn: () => productsApi.getProduct(productToEdit!.id),
    enabled: !!productToEdit?.id && open,
  });

  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    baseSku: '',
    description: '',
    categoryId: '',
    brandId: '',
    isActive: true,
    isPublished: false,
    images: [],
    variants: [],
    isVariable: false,
    costPrice: 0,
    basePrice: 0,
  });

  useEffect(() => {
    if (open && productToEdit) {
      const source = fullProduct || productToEdit;
      setFormData({
        name: source.name,
        baseSku: source.baseSku || '',
        description: source.description || '',
        categoryId: source.categoryId,
        brandId: source.brandId || '',
        isActive: source.isActive,
        isPublished: source.isPublished,
        images: source.images || [],
        variants: source.variants?.filter(v => v.isActive !== false) || [],
        isVariable: source.isVariable || false,
        costPrice: source.costPrice || 0,
        basePrice: source.variants?.[0]?.basePrice || 0,
      });
    } else if (open && !productToEdit) {
      setFormData({
        name: '',
        baseSku: '',
        description: '',
        categoryId: '',
        brandId: '',
        isActive: true,
        isPublished: false,
        images: [],
        variants: [],
        isVariable: false,
        costPrice: 0,
        basePrice: 0,
      });
    }
  }, [open, productToEdit, fullProduct]);

  const mutation = useMutation({
    mutationFn: (data: CreateProductDto) => {
      if (isEditing && productToEdit) return productsApi.updateProduct(productToEdit.id, data);
      return productsApi.createProduct(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Producto actualizado' : 'Producto creado exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al guardar el producto');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) {
      toast.error('Nombre y Categoría son obligatorios');
      return;
    }
    
    // Clean data
    const submissionData = { ...formData };
    if (!submissionData.brandId) delete submissionData.brandId;
    if (!submissionData.baseSku) delete submissionData.baseSku;
    
    mutation.mutate(submissionData);
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Producto Madre' : 'Nuevo Producto Madre'}
      onClose={onClose}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          {/* Use form attribute to trigger submit on the extracted form */}
          <Button variant="primary" type="submit" form="product-form" loading={mutation.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <ProductForm 
        formData={formData} 
        onChange={setFormData} 
        onSubmit={handleSubmit} 
      />
    </Drawer>
  );
}
