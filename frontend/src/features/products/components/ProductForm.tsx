import { Input, Button } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/api/queryKeys';
import { productsApi } from '@/api/products.api';
import { ProductImagesUploader } from './ProductImagesUploader';
import { VariantMassGenerator } from './VariantMassGenerator';
import type { CreateProductDto } from '@/api/products.api';
import { Trash2, Calculator } from 'lucide-react';

interface Props {
  formData: CreateProductDto;
  onChange: (data: CreateProductDto) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProductForm({ formData, onChange, onSubmit }: Props) {
  const { data: categories } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => productsApi.getCategories(),
  });

  const { data: brands } = useQuery({
    queryKey: queryKeys.brands.all(),
    queryFn: () => productsApi.getBrands(),
  });

  const { data: priceLists } = useQuery({
    queryKey: ['price-lists'],
    queryFn: () => productsApi.getPriceLists(),
  });

  const applyMargin = (margin: number) => {
    const cost = formData.costPrice || 0;
    const basePrice = Math.round(cost * margin);
    
    // Si ya hay variantes generadas, actualizarles el precio también
    const updatedVariants = formData.variants?.map(v => ({
      ...v,
      basePrice: Math.round((v.costPrice || cost) * margin)
    }));

    onChange({ ...formData, basePrice, variants: updatedVariants });
  };

  return (
    <form id="product-form" onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. Basic Info */}
      <Section label="Información Básica">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Nombre del Producto *"
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="SKU Base (Opcional)"
            placeholder="Ej: REM-001"
            value={formData.baseSku || ''}
            onChange={(e) => onChange({ ...formData, baseSku: e.target.value })}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Categoría *</label>
            <select
              value={formData.categoryId}
              onChange={(e) => onChange({ ...formData, categoryId: e.target.value })}
              required
              style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            >
              <option value="" disabled>Seleccionar...</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Marca</label>
            <select
              value={formData.brandId || ''}
              onChange={(e) => onChange({ ...formData, brandId: e.target.value })}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}
            >
              <option value="">Sin Marca</option>
              {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </Section>

      {/* 2. Pricing & Cost */}
      <Section label="Precios y Márgenes">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
          <Input
            label="Precio de Costo ($)"
            type="number"
            value={formData.costPrice || 0}
            onChange={(e) => onChange({ ...formData, costPrice: Number(e.target.value) })}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Aplicar Margen</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {priceLists?.map(pl => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => applyMargin(pl.margin)}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-base)', fontSize: '11px', cursor: 'pointer' }}
                >
                  {pl.name}
                </button>
              ))}
            </div>
          </div>
          <Input
            label="Precio de Venta Base ($)"
            type="number"
            value={formData.basePrice || 0}
            onChange={(e) => onChange({ ...formData, basePrice: Number(e.target.value) })}
          />
        </div>
      </Section>

      {/* 3. Type Toggle */}
      <Section label="Variantes del Producto">
        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px', padding: '12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" checked={!formData.isVariable} onChange={() => onChange({ ...formData, isVariable: false, variants: [] })} />
            <span>Producto Simple (Sin talles/colores)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" checked={formData.isVariable} onChange={() => onChange({ ...formData, isVariable: true })} />
            <span>Producto Variable (Múltiples variantes)</span>
          </label>
        </div>

        {formData.isVariable && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <VariantMassGenerator 
              costPrice={formData.costPrice || 0} 
              basePrice={formData.basePrice || 0}
              onGenerate={(newVariants) => onChange({ ...formData, variants: [...(formData.variants || []), ...newVariants] })}
            />

            {formData.variants && formData.variants.length > 0 && (
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead style={{ background: 'var(--bg-elevated)', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Color</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Talle</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Precio</th>
                      <th style={{ textAlign: 'right', padding: '8px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.variants.map((v, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px' }}>{v.color || '-'}</td>
                        <td style={{ padding: '8px' }}>{v.size || '-'}</td>
                        <td style={{ padding: '8px' }}>${v.basePrice}</td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => onChange({ ...formData, variants: formData.variants?.filter((_, idx) => idx !== i) })} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* 4. Images */}
      <Section label="Galería de Imágenes">
        <ProductImagesUploader 
          images={formData.images} 
          onChange={(images) => onChange({ ...formData, images })} 
        />
      </Section>

    </form>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</h3>
      {children}
    </div>
  );
}
