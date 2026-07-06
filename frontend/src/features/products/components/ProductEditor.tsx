import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Wand2, Plus, Image as ImageIcon,
  Archive, Package
} from 'lucide-react';
import { Button } from '@/components/ui';
import { productsApi, type CreateProductDto } from '@/api/products.api';
import { queryKeys } from '@/api/queryKeys';
import type { Product } from '@/types';
import { ProductImagesUploader } from '@/features/products/components/ProductImagesUploader';
import { RelatedProductsPicker } from '@/features/products/components/RelatedProductsPicker';
import { VariantMassGenerator } from '@/features/products/components/VariantMassGenerator';
import { ComboRecipeBuilder } from '@/features/products/components/ComboRecipeBuilder';

interface Props {
  initialData?: Product;
}

export function ProductEditor({ initialData }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    baseSku: '',
    description: '',
    categoryId: '',
    brandId: '',
    type: 'SINGLE',
    manageBatches: false,
    isActive: true,
    isPublished: false,
    images: [],
    variants: [],
    isVariable: false,
    costPrice: 0,
    basePrice: 0,
  });

  const [relatedProductIds, setRelatedProductIds] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({
    weight: '',
    height: '',
    width: '',
    length: ''
  });

  useEffect(() => {
    if (initialData) {
      const source = initialData;
      setFormData({
        name: source.name,
        baseSku: source.baseSku || '',
        description: source.description || '',
        categoryId: source.categoryId,
        brandId: source.brandId || '',
        type: source.type || 'SINGLE',
        manageBatches: source.manageBatches ?? false,
        isActive: source.isActive,
        isPublished: source.isPublished,
        images: source.images || [],
        variants: source.variants?.filter(v => v.isActive !== false).map(v => ({
          id: v.id,
          productId: v.productId || '',
          sku: v.sku,
          size: v.size,
          color: v.color,
          imageUrl: v.imageUrl,
          costPrice: v.costPrice,
          basePrice: v.basePrice,
          isActive: v.isActive,
          attributes: v.attributes
        })) || [],
        isVariable: source.type === 'VARIABLE' || source.isVariable || false,
        costPrice: source.costPrice || 0,
        basePrice: source.variants?.[0]?.basePrice || 0,
        comboLines: source.comboLines || [],
      });

      const meta = source.metadata as any;
      if (meta?.dimensions) {
        setDimensions({
          weight: meta.dimensions.weight || '',
          height: meta.dimensions.height || '',
          width: meta.dimensions.width || '',
          length: meta.dimensions.length || ''
        });
      }
      if (Array.isArray(meta?.relatedProductIds)) {
        setRelatedProductIds(meta.relatedProductIds);
      }
    }
  }, [initialData]);

  const { data: categories } = useQuery({ queryKey: queryKeys.categories.all(), queryFn: () => productsApi.getCategories() });
  const { data: brands } = useQuery({ queryKey: queryKeys.brands.all(), queryFn: () => productsApi.getBrands() });
  const { data: priceLists } = useQuery({ queryKey: queryKeys.priceLists.all(), queryFn: () => productsApi.getPriceLists() });

  const mutation = useMutation({
    mutationFn: (data: CreateProductDto) => {
      // Inject dimensions into metadata
      const meta = {
        dimensions: {
          weight: dimensions.weight,
          height: dimensions.height,
          width: dimensions.width,
          length: dimensions.length
        },
        relatedProductIds,
      };
      
      // Sanitize payload to only include whitelisted properties to prevent backend validation errors
      const safePayload: any = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        brandId: data.brandId,
        baseSku: data.baseSku,
        type: data.type,
        isVariable: data.type === 'VARIABLE' || data.isVariable,
        manageBatches: data.manageBatches,
        costPrice: data.costPrice,
        basePrice: data.basePrice,
        isActive: data.isActive,
        isPublished: data.isPublished,
        metadata: meta,
        images: data.images,
      };

      if (data.comboLines) {
        safePayload.comboLines = data.comboLines.map((c: any) => ({
          childVariantId: c.childVariantId,
          quantity: Number(c.quantity) || 1
        }));
      }

      if (data.variants) {
        safePayload.variants = data.variants.map((v: any) => {
          const sv: any = {
            sku: v.sku,
            size: v.size,
            color: v.color,
            imageUrl: v.imageUrl,
            costPrice: v.costPrice,
            basePrice: v.basePrice,
            isActive: v.isActive,
            attributes: v.attributes,
          };
          if (v.id && !String(v.id).startsWith('temp-')) sv.id = v.id;
          return sv;
        });
      }

      if (!safePayload.brandId) delete safePayload.brandId;
      if (!safePayload.baseSku) delete safePayload.baseSku;

      if (isEditing) return productsApi.updateProduct(initialData!.id, safePayload);
      return productsApi.createProduct(safePayload);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Producto actualizado' : 'Producto creado exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
      navigate('/admin/catalog');
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
    mutation.mutate(formData);
  };



  // UI styles to match the mockup
  const cardStyle = {
    background: 'var(--bg-base)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  };

  const cardTitleStyle = {
    fontSize: '15px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
    color: 'var(--text-primary)'
  };



  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 0' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '6px', marginBottom: '4px' }}>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/admin')}>Dashboard</span> /
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/catalog')}>Productos</span> /
            <span style={{ color: 'var(--text-primary)' }}>{isEditing ? 'Editar producto' : 'Nuevo producto'}</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={24} color="var(--accent)" />
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </h1>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>
          Volver
        </Button>
      </div>

      <form onSubmit={handleSubmit} id="product-form" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Identificación */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}><span style={{ color: 'var(--accent)' }}>■</span> Identificación</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Código Interno</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={formData.baseSku || ''}
                    onChange={(e) => setFormData({ ...formData, baseSku: e.target.value })}
                    placeholder="Ej: LACD01"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}
                  />
                  <Button variant="secondary" style={{ padding: '0 12px' }} title="Autogenerar" onClick={() => setFormData({...formData, baseSku: 'PROD-' + Math.floor(Math.random() * 10000)})}>
                    <Wand2 size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Código de barras</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Escanear o escribir (EAN-13, CODE128)"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}
                  />
                  <Button variant="secondary" style={{ padding: '0 12px' }} title="Autogenerar">
                    <Wand2 size={16} />
                  </Button>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Podés escanear directamente con un lector de códigos.</span>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Tipo de Producto</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, isVariable: e.target.value === 'VARIABLE' })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}
                >
                  <option value="SINGLE">Simple (Unidad estándar)</option>
                  <option value="VARIABLE">Variable (Talles, Colores)</option>
                  <option value="COMBO">Combo (Receta / Kit)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}><span style={{ color: 'var(--accent)' }}>■</span> Descripción</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre completo del producto"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Categoría</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}
                >
                  <option value="" disabled>— Sin categoría —</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px', width: '32.5%' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Marca</label>
              <select
                value={formData.brandId || ''}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}
              >
                <option value="">— Sin marca —</option>
                {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Descripción</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción, detalles, especificaciones..."
                rows={3}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Precios */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--accent)' }}>$</span> Precios
              </h3>
              <span style={{ background: '#22c55e', color: 'white', padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 700 }}>Precios finales</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Precio de costo</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '8px', color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    value={formData.costPrice || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, costPrice: val, basePrice: val });
                    }}
                    style={{ width: '100%', padding: '8px 12px 8px 24px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}
                  />
                </div>
              </div>

              {priceLists?.map((pl, idx) => {
                let percentage = 0;
                let calculatedPrice = 0;
                if (pl.isPercentageBased) {
                  percentage = pl.percentageDiscount || 0;
                  calculatedPrice = formData.costPrice ? Math.round(formData.costPrice * (1 + (percentage / 100))) : 0;
                } else {
                  percentage = Math.round(((pl.margin || 1) - 1) * 100);
                  calculatedPrice = formData.costPrice ? Math.round(formData.costPrice * (pl.margin || 1)) : 0;
                }
                const percentageText = percentage > 0 ? `+${percentage}%` : percentage < 0 ? `${percentage}%` : '0%';

                return (
                  <div key={pl.id}>
                    <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-muted)' }}>
                      {pl.name} <span style={{ background: 'var(--text-muted)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '9px' }}>P{idx + 1}</span>
                      <span style={{ marginLeft: '8px', fontSize: '11px', color: percentage > 0 ? 'var(--green)' : percentage < 0 ? 'var(--red)' : 'var(--text-muted)' }}>{percentageText}</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '8px', color: 'var(--text-muted)' }}>$</span>
                      <input
                        type="number"
                        value={calculatedPrice}
                        readOnly
                        title="Precio calculado automáticamente sobre el costo según la configuración de la lista de precios."
                        style={{ width: '100%', padding: '8px 12px 8px 24px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button type="button" variant="ghost" size="sm" icon={<span style={{ fontWeight: 600 }}>$</span>} onClick={() => {
                const meta = formData.metadata || {};
                const toggled = !meta.usdCurrency;
                setFormData({
                  ...formData,
                  metadata: { ...meta, usdCurrency: toggled ? 'Oficial' : undefined, costUsd: toggled ? 0 : undefined }
                });
              }}>
                {(formData.metadata?.usdCurrency) ? 'Desactivar precios en USD' : 'Ingresar precios en USD'}
              </Button>
            </div>

            {formData.metadata?.usdCurrency && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Tipo de Dólar</label>
                    <select
                      value={formData.metadata.usdCurrency}
                      onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, usdCurrency: e.target.value } })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}
                    >
                      <option value="Oficial">Dólar Oficial</option>
                      <option value="Blue">Dólar Blue</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Costo en USD</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '8px', color: 'var(--text-muted)' }}>U$S</span>
                      <input
                        type="number"
                        value={formData.metadata.costUsd || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, metadata: { ...formData.metadata, costUsd: val } });
                        }}
                        style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}
                      />
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', marginBottom: 0 }}>
                  Nota: El costo en ARS se actualizará automáticamente cuando recotices desde la configuración.
                </p>
              </div>
            )}
          </div>

          {/* Variantes o Combos dinámicos */}
          {formData.type === 'VARIABLE' && (
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}><span style={{ color: 'var(--accent)' }}>■</span> Variantes (Talles / Colores)</h3>
              <VariantMassGenerator 
                costPrice={formData.costPrice || 0} 
                basePrice={formData.basePrice || 0} 
                onGenerate={(vars) => setFormData({ ...formData, variants: vars })} 
              />
              {formData.variants && formData.variants.length > 0 && (
                <div style={{ marginTop: '24px', overflowX: 'auto' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Variantes generadas ({formData.variants.length})</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px' }}>Atributos</th>
                        <th style={{ padding: '8px' }}>SKU</th>
                        <th style={{ padding: '8px' }}>Costo</th>
                        <th style={{ padding: '8px' }}>Precio Base</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.variants.map((v, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px', fontWeight: 500 }}>
                            {v.color} {v.size} {Object.entries(v.attributes || {}).filter(([k]) => k.toLowerCase() !== 'color' && k.toLowerCase() !== 'talle').map(([_, val]) => val).join(' ')}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input 
                              type="text" 
                              value={v.sku || ''} 
                              onChange={(e) => {
                                const newVars = [...formData.variants!];
                                newVars[i].sku = e.target.value;
                                setFormData({ ...formData, variants: newVars });
                              }}
                              placeholder="SKU"
                              style={{ width: '100px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} 
                            />
                          </td>
                          <td style={{ padding: '8px' }}>${v.costPrice}</td>
                          <td style={{ padding: '8px' }}>${v.basePrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {formData.type === 'COMBO' && (
            <div style={cardStyle}>
              <h3 style={cardTitleStyle}><span style={{ color: 'var(--accent)' }}>■</span> Receta del Combo</h3>
              <ComboRecipeBuilder 
                lines={formData.comboLines || []} 
                onChange={(newLines) => setFormData({ ...formData, comboLines: newLines })} 
              />
            </div>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Fotos */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={18} color="var(--text-muted)" /> Fotos del producto
              </h3>
              <span style={{ background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '99px', fontSize: '11px', fontWeight: 600 }}>{formData.images?.length || 0}</span>
            </div>
            
            <ProductImagesUploader
              productId={isEditing ? initialData?.id : undefined}
              images={formData.images || []}
              onChange={(newImages) => setFormData({ ...formData, images: newImages })}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
              JPG, PNG, WebP — máx. 5 MB por foto. La <strong>primera foto</strong> es la imagen principal. Arrastrá para reordenar.
            </p>
          </div>

          {/* Stock */}
          {formData.type === 'SINGLE' && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={18} color="var(--text-muted)" /> Stock
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Stock inicial</label>
                <input
                  type="number"
                  placeholder="0"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Se registrará como movimiento de entrada.</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Stock mínimo</label>
                  <input type="number" placeholder="0" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>Alerta de stock bajo</span>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px', color: 'var(--text-muted)' }}>Stock máximo</label>
                  <input type="number" placeholder="Sin límite" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '8px' }}>
                <input type="checkbox" style={{ marginTop: '4px' }} />
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>Permitir venta sin stock</label>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sobreescribe la configuración global. Este producto se puede vender aunque no tenga stock.</span>
                </div>
              </div>
            </div>
          )}

          {/* Atributos Adicionales */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wand2 size={18} color="var(--text-muted)" /> Atributos adicionales
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Sin atributos libres aún.</p>
            <Button variant="secondary" size="sm" icon={<Plus size={14} />}>Agregar atributo</Button>
          </div>

          {/* Productos relacionados */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px' }}>Productos relacionados</h3>
            <RelatedProductsPicker
              selectedIds={relatedProductIds}
              onChange={setRelatedProductIds}
              excludeProductId={initialData?.id}
            />
          </div>

          {/* Dimensiones */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} color="var(--text-muted)" /> Dimensiones y envío
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Peso (kg)</label>
              <input type="number" step="0.001" value={dimensions.weight} onChange={(e) => setDimensions({...dimensions, weight: e.target.value})} placeholder="0.000" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Alto (cm)</label>
                <input type="number" value={dimensions.height} onChange={(e) => setDimensions({...dimensions, height: e.target.value})} placeholder="0" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Ancho (cm)</label>
                <input type="number" value={dimensions.width} onChange={(e) => setDimensions({...dimensions, width: e.target.value})} placeholder="0" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Largo (cm)</label>
                <input type="number" value={dimensions.length} onChange={(e) => setDimensions({...dimensions, length: e.target.value})} placeholder="0" style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)' }} />
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Truck size={12} /> Usado para calcular costos de envío (Andreani y similares).
            </p>
          </div>

          {/* Configuraciones Web */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} />
              <div>
                <label style={{ fontSize: '14px', fontWeight: 700, display: 'block', color: formData.isActive ? '#3b82f6' : 'var(--text-primary)' }}>Producto activo</label>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Los inactivos no aparecen en ventas.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="checkbox" checked={!formData.isPublished} onChange={(e) => setFormData({...formData, isPublished: !e.target.checked})} style={{ width: '18px', height: '18px' }} />
              <div>
                <label style={{ fontSize: '14px', fontWeight: 700, display: 'block' }}>Ocultar en la web</label>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No aparece en la tienda web del comercio.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'sticky', bottom: '24px' }}>
            <Button variant="primary" type="submit" form="product-form" loading={mutation.isPending} style={{ width: '100%', padding: '12px' }}>
              {isEditing ? 'Guardar Cambios' : '+ Crear producto'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/catalog')} disabled={mutation.isPending} style={{ width: '100%', padding: '12px' }}>
              Cancelar
            </Button>
          </div>

        </div>

      </form>
    </div>
  );
}

// Quick Truck icon since it wasn't imported at the top
function Truck(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 17h4V5H2v12h3"></path>
      <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h2"></path>
      <circle cx="7.5" cy="17.5" r="2.5"></circle>
      <circle cx="17.5" cy="17.5" r="2.5"></circle>
    </svg>
  );
}
