import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { 
  ChevronDown, 
  ChevronRight, 
  Package, 
  Edit2, 
  Trash2, 
  Eye, 
  Copy, 
  Layers, 
  Barcode, 
  ExternalLink,
  Maximize2,
  X
} from 'lucide-react';
import { Badge, SafeImage } from '@/components/ui';
import { ActionGuard } from '@/rbac/ActionGuard';
import { resolveFirstProductImage } from '@/utils/imageUrl';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Product, ProductVariant, PriceList } from '@/types';
import styles from './ProductUnifiedTable.module.css';

interface Props {
  products: Product[];
  priceLists: PriceList[];
  selectedPriceListId?: string;
  onView: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onDuplicate?: (p: Product) => void;
  onPreviewImage?: (src: string, name: string, sku?: string) => void;
}

export function calculateVariantPriceInList(
  variant: ProductVariant,
  productBasePrice = 0,
  priceList?: PriceList | null
): { price: number; isOverride: boolean } {
  const rawBase = (variant.basePrice > 0 ? variant.basePrice : productBasePrice) || (variant.costPrice || 0);
  if (!priceList) {
    return { price: rawBase, isOverride: false };
  }
  const override = variant.priceListEntries?.find(e => e.priceListId === priceList.id)?.overridePrice;
  if (override != null && override > 0) {
    return { price: override, isOverride: true };
  }
  if (priceList.modifierPercentage) {
    return { price: rawBase * (1 + priceList.modifierPercentage / 100), isOverride: false };
  }
  if (priceList.percentageDiscount) {
    return { price: rawBase * (1 - priceList.percentageDiscount / 100), isOverride: false };
  }
  return { price: rawBase, isOverride: false };
}

export function ProductUnifiedTable({
  products,
  priceLists,
  selectedPriceListId,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onPreviewImage,
}: Props) {
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string; sku?: string } | null>(null);

  const triggerPreview = (src: string, name: string, sku?: string) => {
    if (onPreviewImage) {
      onPreviewImage(src, name, sku);
    } else {
      setPreviewImage({ src, name, sku });
    }
  };

  // Close lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Determine which price lists to display as columns (not just base price)
  const activePriceLists = priceLists.filter(pl => pl.isActive !== false);
  const displayedPriceLists = selectedPriceListId
    ? activePriceLists.filter(pl => pl.id === selectedPriceListId)
    : activePriceLists;

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Producto / SKU</th>
              <th>Variantes</th>
              <th className={styles.numericCell}>Costo</th>
              {displayedPriceLists.length > 0 ? (
                displayedPriceLists.map((pl) => (
                  <th key={pl.id} className={styles.numericCell}>
                    Lista: {pl.name}
                    {pl.modifierPercentage ? (
                      <span style={{ fontSize: 10, opacity: 0.8, marginLeft: 4 }}>
                        ({pl.modifierPercentage > 0 ? '+' : ''}{pl.modifierPercentage}%)
                      </span>
                    ) : null}
                  </th>
                ))
              ) : (
                <th className={styles.numericCell}>Precio Venta</th>
              )}
              <th className={styles.numericCell}>Físico</th>
              <th className={styles.numericCell}>Reservado</th>
              <th className={styles.numericCell}>Disponible</th>
              <th style={{ width: 110, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const isExpanded = expandedIds.has(product.id);
              const variants = product.variants || [];
              const hasVariants = variants.length > 0;
              const totalStock = product.totalStock ?? variants.reduce((acc, v) => acc + (v.stock?.available ?? 0), 0);
              const totalPhysical = product.totalPhysical ?? variants.reduce((acc, v) => acc + (v.stock?.physical ?? (v.stock?.available ?? 0)), 0);
              const totalReserved = product.totalReserved ?? variants.reduce((acc, v) => acc + (v.stock?.reserved ?? 0), 0);

              // Cost formatting
              const minCost = product.priceRange?.minCost ?? product.costPrice ?? 0;
              const maxCost = product.priceRange?.maxCost ?? product.costPrice ?? 0;
              const costLabel = minCost === maxCost || !maxCost
                ? formatCurrency(minCost)
                : `${formatCurrency(minCost)} - ${formatCurrency(maxCost)}`;

              // Calculate price labels per displayed price list
              const priceListLabels = displayedPriceLists.map((pl) => {
                if (hasVariants) {
                  const listPrices = variants.map(v => calculateVariantPriceInList(v, product.basePrice, pl).price);
                  const minL = Math.min(...listPrices);
                  const maxL = Math.max(...listPrices);
                  return minL === maxL ? formatCurrency(minL) : `${formatCurrency(minL)} - ${formatCurrency(maxL)}`;
                }
                const dummyV: ProductVariant = {
                  id: '',
                  productId: product.id,
                  sku: '',
                  costPrice: product.costPrice || 0,
                  basePrice: product.basePrice || 0,
                  isActive: true
                };
                return formatCurrency(calculateVariantPriceInList(dummyV, product.basePrice, pl).price);
              });

              // Fallback single price label if no lists are registered
              const fallbackPriceLabel = formatCurrency(product.basePrice || 0);

              const stockClass = totalStock > 5 ? styles.stockOk : totalStock > 0 ? styles.stockLow : styles.stockZero;
              const stockText = totalStock > 0 ? `${totalStock} un.` : 'Agotado';

              return (
                <ProductRowGroup
                  key={product.id}
                  product={product}
                  isExpanded={isExpanded}
                  hasVariants={hasVariants}
                  variants={variants}
                  costLabel={costLabel}
                  displayedPriceLists={displayedPriceLists}
                  priceListLabels={priceListLabels}
                  fallbackPriceLabel={fallbackPriceLabel}
                  totalPhysical={totalPhysical}
                  totalReserved={totalReserved}
                  totalStock={totalStock}
                  stockClass={stockClass}
                  stockText={stockText}
                  onToggleExpand={(e) => toggleExpand(product.id, e)}
                  onView={() => onView(product)}
                  onEdit={() => onEdit(product)}
                  onDelete={() => onDelete(product)}
                  onDuplicate={() => onDuplicate?.(product)}
                  onManageVariants={() => navigate(`/admin/catalog/${product.id}/variants`)}
                  onPreviewImage={triggerPreview}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Lightbox Modal for High-Res Image Preview */}
      {previewImage && (
        <div
          className={styles.lightbox}
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa de imagen"
        >
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setPreviewImage(null)}
              aria-label="Cerrar vista previa"
              title="Cerrar (Esc)"
            >
              <X size={20} />
            </button>
            <img
              src={previewImage.src}
              alt={previewImage.name}
              className={styles.lightboxImg}
            />
            <div className={styles.lightboxFooter}>
              <p className={styles.lightboxTitle}>{previewImage.name}</p>
              {previewImage.sku && (
                <p className={styles.lightboxSubtitle}>SKU: {previewImage.sku}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface RowGroupProps {
  product: Product;
  isExpanded: boolean;
  hasVariants: boolean;
  variants: ProductVariant[];
  costLabel: string;
  displayedPriceLists: PriceList[];
  priceListLabels: string[];
  fallbackPriceLabel: string;
  totalPhysical: number;
  totalReserved: number;
  totalStock: number;
  stockClass: string;
  stockText: string;
  onToggleExpand: (e: React.MouseEvent) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onManageVariants: () => void;
  onPreviewImage: (src: string, name: string, sku?: string) => void;
}

function ProductRowGroup({
  product,
  isExpanded,
  hasVariants,
  variants,
  costLabel,
  displayedPriceLists,
  priceListLabels,
  fallbackPriceLabel,
  totalPhysical,
  totalReserved,
  totalStock,
  stockClass,
  stockText,
  onToggleExpand,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onManageVariants,
  onPreviewImage,
}: RowGroupProps) {
  const img = resolveFirstProductImage(product.images);
  const categoryName = (product as any).category?.name || 'Sin Categoría';
  const brandName = (product as any).brand?.name;

  return (
    <>
      <tr 
        className={clsx(styles.row, isExpanded && styles.rowExpanded)}
        onClick={hasVariants ? onToggleExpand : onView}
        style={{ cursor: 'pointer' }}
      >
        <td style={{ textAlign: 'center' }}>
          {hasVariants ? (
            <button
              type="button"
              className={styles.expandBtn}
              onClick={onToggleExpand}
              title={isExpanded ? 'Ocultar variantes' : 'Ver variantes'}
              aria-label={isExpanded ? 'Ocultar variantes' : 'Ver variantes'}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>•</span>
          )}
        </td>

        <td>
          <div className={styles.productCell}>
            <div 
              className={styles.thumb}
              onClick={(e) => {
                if (img) {
                  e.stopPropagation();
                  onPreviewImage(img, product.name, product.baseSku);
                }
              }}
              title={img ? 'Clic para ampliar foto' : undefined}
            >
              <SafeImage
                src={img}
                alt={product.name}
                className={styles.thumbImg}
                fallback={<Package size={18} color="var(--text-muted)" />}
              />
              {img && (
                <div className={styles.thumbZoom}>
                  <Maximize2 size={13} />
                </div>
              )}
            </div>
            <div className={styles.productMeta}>
              <span className={styles.productName}>{product.name}</span>
              <div className={styles.productSub}>
                {product.baseSku && <span className={styles.skuTag}>{product.baseSku}</span>}
                <span className={styles.categoryTag}>{categoryName}</span>
                {brandName && <span className={styles.categoryTag}>• {brandName}</span>}
              </div>
            </div>
          </div>
        </td>

        <td>
          {hasVariants ? (
            <Badge color="purple">
              {variants.length} {variants.length === 1 ? 'variante' : 'variantes'}
            </Badge>
          ) : (
            <Badge color="gray">Única</Badge>
          )}
        </td>

        <td className={clsx(styles.numericCell, styles.priceCost)}>
          {costLabel}
        </td>

        {displayedPriceLists.length > 0 ? (
          displayedPriceLists.map((pl, idx) => (
            <td key={pl.id} className={clsx(styles.numericCell, styles.pricePrimary)}>
              {priceListLabels[idx]}
            </td>
          ))
        ) : (
          <td className={clsx(styles.numericCell, styles.pricePrimary)}>
            {fallbackPriceLabel}
          </td>
        )}

        <td className={styles.numericCell}>
          {totalPhysical}
        </td>

        <td className={clsx(styles.numericCell, totalReserved > 0 && styles.priceCost)}>
          {totalReserved}
        </td>

        <td className={styles.numericCell}>
          <span className={clsx(styles.stockBadge, stockClass)}>
            <span className={styles.stockDot} />
            {stockText}
          </span>
        </td>

        <td className={styles.actionCell} onClick={(e) => e.stopPropagation()}>
          <div className={styles.actionGroup}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onView}
              title="Ver ficha técnica"
              aria-label="Ver ficha técnica"
            >
              <Eye size={15} />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onManageVariants}
              title="Gestionar Variantes y Stock"
              aria-label="Gestionar Variantes"
            >
              <Layers size={15} />
            </button>
            <ActionGuard action="create" subject="Catalog">
              <button
                type="button"
                className={styles.iconBtn}
                onClick={onDuplicate}
                title="Duplicar producto"
                aria-label="Duplicar producto"
              >
                <Copy size={15} />
              </button>
            </ActionGuard>
            <ActionGuard action="manage" subject="Catalog">
              <button
                type="button"
                className={styles.iconBtn}
                onClick={onEdit}
                title="Editar producto"
                aria-label="Editar producto"
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                className={clsx(styles.iconBtn, styles.iconBtnDanger)}
                onClick={onDelete}
                title="Eliminar producto"
                aria-label="Eliminar producto"
              >
                <Trash2 size={15} />
              </button>
            </ActionGuard>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={7 + Math.max(displayedPriceLists.length, 1)} style={{ padding: 0 }}>
            <div className={styles.nestedContainer}>
              <div className={styles.nestedHeader}>
                <span className={styles.nestedTitle}>
                  <Package size={14} /> Desglose de SKUs Físicos ({variants.length})
                </span>
                <button
                  type="button"
                  className={styles.nestedLink}
                  onClick={onManageVariants}
                >
                  Abrir gestor de variantes <ExternalLink size={12} />
                </button>
              </div>

              {variants.length === 0 ? (
                <div className={styles.emptyVariants}>
                  No hay variantes generadas para este producto. Creá variantes desde el gestor.
                </div>
              ) : (
                <table className={styles.subTable}>
                  <thead>
                    <tr>
                      <th style={{ width: 34 }}></th>
                      <th>SKU</th>
                      <th>Cód. Barras</th>
                      <th>Atributos (Talle / Color)</th>
                      <th className={styles.numericCell}>Costo</th>
                      {displayedPriceLists.length > 0 ? (
                        displayedPriceLists.map((pl) => (
                          <th key={pl.id} className={styles.numericCell}>
                            {pl.name}
                          </th>
                        ))
                      ) : (
                        <th className={styles.numericCell}>Venta</th>
                      )}
                      <th className={styles.numericCell}>Físico</th>
                      <th className={styles.numericCell}>Reservado</th>
                      <th className={styles.numericCell}>Disponible</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const avail = v.stock?.available ?? 0;
                      const phys = v.stock?.physical ?? avail;
                      const resv = v.stock?.reserved ?? 0;
                      const vStockClass = avail > 5 ? styles.stockOk : avail > 0 ? styles.stockLow : styles.stockZero;
                      const vImg = v.imageUrl || img;

                      return (
                        <tr key={v.id}>
                          <td>
                            {vImg ? (
                              <div
                                className={styles.thumb}
                                style={{ width: 28, height: 28 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreviewImage(vImg, product.name, v.sku);
                                }}
                                title="Ampliar foto de variante"
                              >
                                <SafeImage
                                  src={vImg}
                                  alt={v.sku}
                                  className={styles.thumbImg}
                                  fallback={<Package size={12} color="var(--text-muted)" />}
                                />
                                <div className={styles.thumbZoom}>
                                  <Maximize2 size={10} />
                                </div>
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <span className={styles.mono}>{v.sku}</span>
                          </td>
                          <td>
                            {v.barcode ? (
                              <span className={styles.barcodeRow}>
                                <Barcode size={13} /> {v.barcode}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.attrChips}>
                              {v.size && <span className={styles.attrChip}>Talle: {v.size}</span>}
                              {v.color && <span className={styles.attrChip}>Color: {v.color}</span>}
                              {!v.size && !v.color && <span style={{ color: 'var(--text-muted)' }}>Estándar</span>}
                            </div>
                          </td>
                          <td className={clsx(styles.numericCell, styles.priceCost)}>
                            {formatCurrency(v.costPrice || product.costPrice || 0)}
                          </td>
                          {displayedPriceLists.length > 0 ? (
                            displayedPriceLists.map((pl) => {
                              const variantPricing = calculateVariantPriceInList(v, product.basePrice, pl);
                              return (
                                <td key={pl.id} className={clsx(styles.numericCell, styles.pricePrimary)}>
                                  {formatCurrency(variantPricing.price)}
                                  {variantPricing.isOverride && ' *'}
                                </td>
                              );
                            })
                          ) : (
                            <td className={clsx(styles.numericCell, styles.pricePrimary)}>
                              {formatCurrency(v.basePrice || product.basePrice || 0)}
                            </td>
                          )}
                          <td className={styles.numericCell}>
                            {phys}
                          </td>
                          <td className={styles.numericCell}>
                            {resv}
                          </td>
                          <td className={styles.numericCell}>
                            <span className={clsx(styles.stockBadge, vStockClass)}>
                              <span className={styles.stockDot} />
                              {avail} un.
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
