import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Wand2, Plus, Image as ImageIcon,
  Archive, Package, Truck
} from 'lucide-react';
import { Button } from '@/components/ui';
import { upload } from '@/api/client';
import { productsApi, type CreateProductDto } from '@/api/products.api';
import { identifiersApi } from '@/api/identifiers.api';
import { queryKeys } from '@/api/queryKeys';
import type { Product } from '@/types';
import { ProductImagesUploader } from '@/features/products/components/ProductImagesUploader';
import { RelatedProductsPicker } from '@/features/products/components/RelatedProductsPicker';
import { VariantMassGenerator } from '@/features/products/components/VariantMassGenerator';
import { ComboRecipeBuilder } from '@/features/products/components/ComboRecipeBuilder';
import { dataUrlToFile } from '@/features/products/utils/dataUrlToFile';
import clsx from 'clsx';
import styles from './ProductEditor.module.css';

interface Props {
  initialData?: Product;
}

export function ProductEditor({ initialData }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  type EditorTab = 'general' | 'precios' | 'variantes';
  const EDITOR_TABS: { id: EditorTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'precios', label: 'Precios' },
    { id: 'variantes', label: 'Variantes' },
  ];
  const [activeTab, setActiveTab] = useState<EditorTab>('general');

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
  const [productBarcode, setProductBarcode] = useState('');
  const [generatingSku, setGeneratingSku] = useState(false);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
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
          barcode: v.barcode,
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
        comboLines: (source.comboLines || []).map((cl: any) => ({
          id: cl.id,
          childVariantId: cl.childVariantId,
          quantity: cl.quantity,
          productName: cl.childVariant?.product?.name || cl.productName || 'Producto',
          variantSku: cl.childVariant?.sku || cl.variantSku || '',
          basePrice: cl.childVariant?.basePrice ?? cl.basePrice ?? 0,
        })),
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
      const firstVariant = source.variants?.find(v => v.isActive !== false) || source.variants?.[0];
      setProductBarcode(firstVariant?.barcode || '');
    }
  }, [initialData]);

  const { data: categories } = useQuery({ queryKey: queryKeys.categories.all(), queryFn: () => productsApi.getCategories() });
  const { data: brands } = useQuery({ queryKey: queryKeys.brands.all(), queryFn: () => productsApi.getBrands() });
  const { data: priceLists } = useQuery({ queryKey: queryKeys.priceLists.all(), queryFn: () => productsApi.getPriceLists() });

  const mutation = useMutation({
    mutationFn: async (data: CreateProductDto) => {
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

      // Prefer multipart upload over embedding base64 in JSON (body limit + nginx).
      const allImages = Array.isArray(data.images) ? data.images : [];
      const dataUrlImages = allImages.filter((img) => typeof img === 'string' && img.startsWith('data:'));
      const remoteImages = allImages.filter((img) => typeof img === 'string' && !img.startsWith('data:'));
      
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
        images: remoteImages,
      };

      if (data.comboLines) {
        safePayload.comboLines = data.comboLines.map((c: any) => ({
          ...(c.id ? { id: c.id } : {}),
          childVariantId: c.childVariantId,
          quantity: Number(c.quantity) || 1
        }));
      }

      if (data.type === 'VARIABLE' && data.variants) {
        safePayload.variants = data.variants.map((v: any) => {
          const sv: any = {
            sku: v.sku,
            barcode: v.barcode,
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
      } else if (productBarcode.trim() || isEditing) {
        // Simple/combo: persist barcode on the default variant
        const existingVariant = initialData?.variants?.find(v => v.isActive !== false) || initialData?.variants?.[0];
        const sv: any = {
          barcode: productBarcode.trim() || undefined,
          costPrice: data.costPrice,
          basePrice: data.basePrice,
          isActive: true,
        };
        if (existingVariant?.id) sv.id = existingVariant.id;
        if (existingVariant?.sku) sv.sku = existingVariant.sku;
        // Only send variants payload when we have something to persist
        if (productBarcode.trim() || existingVariant?.id) {
          safePayload.variants = [sv];
        }
      }

      if (!safePayload.brandId) delete safePayload.brandId;
      if (!safePayload.baseSku) delete safePayload.baseSku;

      const product = isEditing
        ? await productsApi.updateProduct(initialData!.id, safePayload)
        : await productsApi.createProduct(safePayload);

      // Upload pending data-URL photos after the product exists (multipart → /uploads/products).
      for (let i = 0; i < dataUrlImages.length; i++) {
        const file = dataUrlToFile(dataUrlImages[i], `product-${i}`);
        if (!file) continue;
        await upload<{ url: string }>(`/products/${product.id}/images`, file, 'image');
      }

      return product;
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




  return (
    <div className={styles.wrapper}>
      
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumbs}>
            <span className={styles.breadcrumbLink} onClick={() => navigate('/admin')}>Dashboard</span> /
            <span className={styles.breadcrumbLink} onClick={() => navigate('/admin/catalog')}>Productos</span> /
            <span className={styles.breadcrumbCurrent}>{isEditing ? 'Editar producto' : 'Nuevo producto'}</span>
          </div>
          <h1 className={styles.pageTitle}>
            <Package size={24} color="var(--accent)" />
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </h1>
        </div>
        <Button variant="secondary" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>
          Volver
        </Button>
      </div>

      <div className={styles.tabsWrap}>
        <div className={styles.tabs} role="tablist" aria-label="Secciones del producto">
          {EDITOR_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={clsx(styles.tab, activeTab === tab.id && styles.tabActive)}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} id="product-form" className={styles.formGrid}>
        
        {/* LEFT COLUMN */}
        <div className={styles.column}>
          {activeTab === 'general' && (<>
          {/* Identificación */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><span className={styles.cardTitleAccent}>■</span> Identificación</h3>
            <div className={styles.fieldGrid3}>
              <div>
                <label className={styles.label}>Código Interno</label>
                <div className={styles.inputRow}>
                  <input
                    type="text"
                    value={formData.baseSku || ''}
                    onChange={(e) => setFormData({ ...formData, baseSku: e.target.value })}
                    placeholder="Ej: LACD01"
                    className={styles.input}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className={styles.iconBtn}
                    title="Autogenerar"
                    disabled={generatingSku}
                    onClick={async () => {
                      try {
                        setGeneratingSku(true);
                        const res = await identifiersApi.generateBaseSku();
                        setFormData(prev => ({ ...prev, baseSku: res.sku }));
                      } catch {
                        toast.error('No se pudo generar el SKU');
                      } finally {
                        setGeneratingSku(false);
                      }
                    }}
                  >
                    <Wand2 size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <label className={styles.label}>Código de barras</label>
                <div className={styles.inputRow}>
                  <input
                    type="text"
                    value={productBarcode}
                    onChange={(e) => setProductBarcode(e.target.value)}
                    placeholder="Escanear o escribir (EAN-13, CODE128)"
                    disabled={formData.type === 'VARIABLE'}
                    className={styles.input}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className={styles.iconBtn}
                    title="Autogenerar"
                    disabled={generatingBarcode || formData.type === 'VARIABLE'}
                    onClick={async () => {
                      try {
                        setGeneratingBarcode(true);
                        const res = await identifiersApi.generateBarcode();
                        setProductBarcode(res.barcode);
                      } catch {
                        toast.error('No se pudo generar el código de barras');
                      } finally {
                        setGeneratingBarcode(false);
                      }
                    }}
                  >
                    <Wand2 size={16} />
                  </Button>
                </div>
                <span className={styles.hint}>
                  {formData.type === 'VARIABLE'
                    ? 'En productos variables el código de barras se define por cada variante.'
                    : 'Podés escanear directamente con un lector de códigos.'}
                </span>
              </div>

              <div>
                <label className={styles.label}>Tipo de Producto</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, isVariable: e.target.value === 'VARIABLE' })}
                  className={styles.input}
                >
                  <option value="SINGLE">Simple (Unidad estándar)</option>
                  <option value="VARIABLE">Variable (Talles, Colores)</option>
                  <option value="COMBO">Combo (Receta / Kit)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><span className={styles.cardTitleAccent}>■</span> Descripción</h3>
            <div className={styles.fieldGrid2}>
              <div>
                <label className={styles.label}>Nombre *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre completo del producto"
                  className={styles.input}
                />
              </div>
              <div>
                <label className={styles.label}>Categoría</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className={styles.input}
                >
                  <option value="" disabled>— Sin categoría —</option>
                  {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className={styles.fieldThird}>
              <label className={styles.label}>Marca</label>
              <select
                value={formData.brandId || ''}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className={styles.input}
              >
                <option value="">— Sin marca —</option>
                {brands?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div>
              <label className={styles.label}>Descripción</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción, detalles, especificaciones..."
                rows={3}
                className={styles.textarea}
              />
            </div>
          </div>
          </>)}

          {activeTab === 'precios' && (
          <div className={styles.card}>
            <div className={styles.priceHeader}>
              <h3 className={styles.cardTitle}>
                <span className={styles.cardTitleAccent}>$</span> Precios
              </h3>
              <span className={styles.badge}>Precios finales</span>
            </div>

            <div className={styles.priceGrid}>
              <div>
                <label className={styles.label}>Precio de costo</label>
                <div className={styles.priceInputWrap}>
                  <span className={styles.pricePrefix}>$</span>
                  <input
                    type="number"
                    value={formData.costPrice || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormData({ ...formData, costPrice: val, basePrice: val });
                    }}
                    className={clsx(styles.input, styles.inputWithPrefix)}
                  />
                </div>
              </div>

              {priceLists?.map((pl: any, idx: number) => {
                const referencePrice = (formData.basePrice && formData.basePrice > 0)
                  ? formData.basePrice
                  : (formData.costPrice || 0);
                let percentage = 0;
                let calculatedPrice = 0;
                const isModifier = pl.type === 'MODIFIER' || pl.isPercentageBased;
                if (isModifier) {
                  // Use modifierPercentage (markup). percentageDiscount is a legacy negated mirror.
                  percentage = pl.modifierPercentage ?? -(pl.percentageDiscount || 0);
                  calculatedPrice = referencePrice
                    ? Math.round(referencePrice * (1 + (percentage / 100)))
                    : 0;
                } else {
                  percentage = Math.round(((pl.margin || 1) - 1) * 100);
                  calculatedPrice = referencePrice ? Math.round(referencePrice * (pl.margin || 1)) : 0;
                }
                const percentageText = percentage > 0 ? `+${percentage}%` : percentage < 0 ? `${percentage}%` : '0%';

                return (
                  <div key={pl.id}>
                    <label className={clsx(styles.label, styles.labelMuted)}>
                      {pl.name} <span className={styles.priceListBadge}>P{idx + 1}</span>
                      <span className={clsx(styles.priceListPct, percentage > 0 ? styles.priceListPctUp : percentage < 0 ? styles.priceListPctDown : styles.priceListPctNeutral)}>{percentageText}</span>
                    </label>
                    <div className={styles.priceInputWrap}>
                      <span className={styles.pricePrefix}>$</span>
                      <input
                        type="number"
                        value={calculatedPrice}
                        readOnly
                        title="Precio calculado automáticamente sobre el costo según la configuración de la lista de precios."
                        className={clsx(styles.input, styles.inputWithPrefix)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.priceActions}>
              <Button type="button" variant="ghost" size="sm" icon={<span className={styles.currencyIcon}>$</span>} onClick={() => {
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
              <div className={styles.usdPanel}>
                <div className={styles.fieldGrid2Eq}>
                  <div>
                    <label className={styles.label}>Tipo de Dólar</label>
                    <select
                      value={formData.metadata.usdCurrency}
                      onChange={(e) => setFormData({ ...formData, metadata: { ...formData.metadata, usdCurrency: e.target.value } })}
                      className={styles.input}
                    >
                      <option value="Oficial">Dólar Oficial</option>
                      <option value="Blue">Dólar Blue</option>
                    </select>
                  </div>
                  <div>
                    <label className={styles.label}>Costo en USD</label>
                    <div className={styles.priceInputWrap}>
                      <span className={styles.pricePrefix}>U$S</span>
                      <input
                        type="number"
                        value={formData.metadata.costUsd || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, metadata: { ...formData.metadata, costUsd: val } });
                        }}
                        className={clsx(styles.input, styles.inputWithPrefixUsd)}
                      />
                    </div>
                  </div>
                </div>
                <p className={styles.usdNote}>
                  Nota: El costo en ARS se actualizará automáticamente cuando recotices desde la configuración.
                </p>
              </div>
            )}
          </div>
          )}

          {activeTab === 'variantes' && (<>
          {/* Variantes o Combos dinámicos */}
          {formData.type === 'VARIABLE' && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><span className={styles.cardTitleAccent}>■</span> Variantes (Talles / Colores)</h3>
              <VariantMassGenerator 
                costPrice={formData.costPrice || 0} 
                basePrice={formData.basePrice || 0}
                baseSku={formData.baseSku || ''}
                onGenerate={(vars) => setFormData({ ...formData, variants: vars })} 
              />
              {formData.variants && formData.variants.length > 0 && (
                <div className={styles.tableWrap}>
                  <h4 className={styles.variantSectionTitle}>Variantes generadas ({formData.variants.length})</h4>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Atributos</th>
                        <th>SKU</th>
                        <th>Barras</th>
                        <th>Costo</th>
                        <th>Precio Base</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.variants.map((v, i) => (
                        <tr key={i}>
                          <td className={styles.variantCell}>
                            {v.color} {v.size} {Object.entries(v.attributes || {}).filter(([k]) => k.toLowerCase() !== 'color' && k.toLowerCase() !== 'talle').map(([_, val]) => val).join(' ')}
                          </td>
                          <td>
                            <input 
                              type="text" 
                              value={v.sku || ''} 
                              onChange={(e) => {
                                const newVars = [...formData.variants!];
                                newVars[i].sku = e.target.value;
                                setFormData({ ...formData, variants: newVars });
                              }}
                              placeholder="SKU"
                              className={styles.inputSm} 
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={(v as any).barcode || ''}
                              onChange={(e) => {
                                const newVars = [...formData.variants!];
                                (newVars[i] as any).barcode = e.target.value;
                                setFormData({ ...formData, variants: newVars });
                              }}
                              placeholder="Auto"
                              className={styles.inputMd}
                            />
                          </td>
                          <td>${v.costPrice}</td>
                          <td>${v.basePrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {formData.type === 'COMBO' && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><span className={styles.cardTitleAccent}>■</span> Receta del Combo</h3>
              <ComboRecipeBuilder 
                lines={formData.comboLines || []} 
                onChange={(newLines) => setFormData({ ...formData, comboLines: newLines })} 
              />
            </div>
          )}

          {formData.type === 'SINGLE' && (
            <div className={styles.card}>
              <p className={styles.emptyTab}>Este producto es de tipo simple y no requiere variantes ni receta de combo.</p>
            </div>
          )}
          </>)}

        </div>

        {/* RIGHT COLUMN — publicación, fotos, stock y acciones siempre visibles */}
        <div className={styles.sidebar}>
          
          {/* Fotos */}
          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h3 className={styles.cardTitle}>
                <ImageIcon size={18} color="var(--text-muted)" /> Fotos del producto
              </h3>
              <span className={styles.badgeMuted}>{formData.images?.length || 0}</span>
            </div>
            
            <ProductImagesUploader
              productId={isEditing ? initialData?.id : undefined}
              images={formData.images || []}
              onChange={(newImages) => setFormData({ ...formData, images: newImages })}
            />
            <p className={styles.hintCenter}>
              JPG, PNG, WebP — máx. 5 MB por foto. La <strong>primera foto</strong> es la imagen principal. Arrastrá para reordenar.
            </p>
          </div>

          {/* Stock */}
          {formData.type === 'SINGLE' && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <Archive size={18} color="var(--text-muted)" /> Stock
              </h3>
              
              <div className={styles.field}>
                <label className={styles.label}>Stock inicial</label>
                <input
                  type="number"
                  placeholder="0"
                  className={styles.input}
                />
                <span className={styles.hint}>Se registrará como movimiento de entrada.</span>
              </div>

              <div className={styles.fieldGrid2Eq}>
                <div>
                  <label className={styles.label}>Stock mínimo</label>
                  <input type="number" placeholder="0" className={styles.input} />
                  <span className={styles.hint}>Alerta de stock bajo</span>
                </div>
                <div>
                  <label className={clsx(styles.label, styles.labelMuted)}>Stock máximo</label>
                  <input type="number" placeholder="Sin límite" className={styles.input} />
                </div>
              </div>

              <div className={styles.checkboxRow}>
                <input type="checkbox" className={styles.checkbox} />
                <div>
                  <label className={styles.checkboxLabel}>Permitir venta sin stock</label>
                  <span className={styles.hint}>Sobreescribe la configuración global. Este producto se puede vender aunque no tenga stock.</span>
                </div>
              </div>
            </div>
          )}

          {/* Atributos Adicionales */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <Wand2 size={18} color="var(--text-muted)" /> Atributos adicionales
            </h3>
            <p className={styles.hint}>Sin atributos libres aún.</p>
            <Button variant="secondary" size="sm" icon={<Plus size={14} />}>Agregar atributo</Button>
          </div>

          {/* Productos relacionados */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Productos relacionados</h3>
            <RelatedProductsPicker
              selectedIds={relatedProductIds}
              onChange={setRelatedProductIds}
              excludeProductId={initialData?.id}
            />
          </div>

          {/* Dimensiones */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <Package size={18} color="var(--text-muted)" /> Dimensiones y envío
            </h3>
            
            <div className={styles.field}>
              <label className={styles.label}>Peso (kg)</label>
              <input type="number" step="0.001" value={dimensions.weight} onChange={(e) => setDimensions({...dimensions, weight: e.target.value})} placeholder="0.000" className={styles.input} />
            </div>

            <div className={styles.fieldGrid3Eq}>
              <div>
                <label className={styles.label}>Alto (cm)</label>
                <input type="number" value={dimensions.height} onChange={(e) => setDimensions({...dimensions, height: e.target.value})} placeholder="0" className={styles.input} />
              </div>
              <div>
                <label className={styles.label}>Ancho (cm)</label>
                <input type="number" value={dimensions.width} onChange={(e) => setDimensions({...dimensions, width: e.target.value})} placeholder="0" className={styles.input} />
              </div>
              <div>
                <label className={styles.label}>Largo (cm)</label>
                <input type="number" value={dimensions.length} onChange={(e) => setDimensions({...dimensions, length: e.target.value})} placeholder="0" className={styles.input} />
              </div>
            </div>
            <p className={styles.shippingHint}>
              <Truck size={12} /> Usado para calcular costos de envío (Andreani y similares).
            </p>
          </div>

          {/* Configuraciones Web */}
          <div className={styles.card}>
            <div className={styles.checkboxRow}>
              <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className={styles.checkbox} />
              <div>
                <label className={clsx(styles.checkboxLabel, formData.isActive && styles.checkboxLabelActive)}>Producto activo</label>
                <span className={styles.checkboxHint}>Los inactivos no aparecen en ventas.</span>
              </div>
            </div>

            <div className={styles.checkboxRow}>
              <input type="checkbox" checked={!formData.isPublished} onChange={(e) => setFormData({...formData, isPublished: !e.target.checked})} className={styles.checkbox} />
              <div>
                <label className={styles.checkboxLabel}>Ocultar en la web</label>
                <span className={styles.checkboxHint}>No aparece en la tienda web del comercio.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons (desktop sidebar) */}
          <div className={styles.actions}>
            <Button variant="primary" type="submit" form="product-form" loading={mutation.isPending} className={styles.actionBtn}>
              {isEditing ? 'Guardar Cambios' : '+ Crear producto'}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/admin/catalog')} disabled={mutation.isPending} className={styles.actionBtn}>
              Cancelar
            </Button>
          </div>

        </div>

      </form>

      {/* Sticky save bar on mobile */}
      <div className={styles.mobileActions}>
        <Button variant="primary" type="submit" form="product-form" loading={mutation.isPending} fullWidth>
          {isEditing ? 'Guardar Cambios' : '+ Crear producto'}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/admin/catalog')} disabled={mutation.isPending} fullWidth>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
