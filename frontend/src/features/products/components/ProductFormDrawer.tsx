import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
      setFormData({
        name: productToEdit.name,
        baseSku: productToEdit.baseSku || '',
        description: productToEdit.description || '',
        categoryId: productToEdit.categoryId,
        brandId: productToEdit.brandId || '',
        isActive: productToEdit.isActive,
        isPublished: productToEdit.isPublished,
        images: productToEdit.images || [],
        variants: productToEdit.variants || [],
        isVariable: productToEdit.isVariable || false,
        costPrice: productToEdit.costPrice || 0,
        basePrice: productToEdit.variants?.[0]?.basePrice || 0,
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
  }, [open, productToEdit]);

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
