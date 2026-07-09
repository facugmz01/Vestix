import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ShoppingCart, ShieldCheck, Truck, RotateCcw, Check } from 'lucide-react';
import clsx from 'clsx';
import { storefrontApi } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from './OnlineProductDetailPage.module.css';

export default function OnlineProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const prefix = storePrefix();
  const addItem = useCartStore(s => s.addItem);

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: queryKeys.storefront.product(id!),
    queryFn: () => storefrontApi.getProduct(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if ((product?.variants?.length ?? 0) > 0 && !selectedVariantId) {
      const inStock = product!.variants!.find(v => v.stock > 0);
      setSelectedVariantId(inStock?.id ?? product!.variants![0].id);
    }
  }, [product, selectedVariantId]);

  if (isLoading) {
    return (
      <div className={styles.skeletonPage}>
        <div className={styles.skeletonImage} />
        <div className={styles.skeletonInfo}>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={clsx(styles.skeletonLine, i === 1 ? styles.skeletonLineLg : styles.skeletonLineSm)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h2>Producto no encontrado</h2>
        <Link to={`${prefix}/`} className={styles.notFoundLink}>Volver al catálogo</Link>
      </div>
    );
  }

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
  const isAvailable = selectedVariant ? selectedVariant.stock > 0 : product.inStock;
  const displayPrice = selectedVariant?.price ?? product.price ?? product.basePrice ?? 0;
  const priceRange =
    product.maxPrice && product.maxPrice > product.price
      ? `${formatCurrency(product.price)} – ${formatCurrency(product.maxPrice)}`
      : formatCurrency(displayPrice);

  const handleAddToCart = () => {
    if (!selectedVariant && (product.variants?.length ?? 0) > 0) {
      toast.error('Seleccioná una variante antes de agregar al carrito.');
      return;
    }
    const variantId = selectedVariant?.id || `${product.id}-default`;

    for (let i = 0; i < qty; i++) {
      addItem({
        variantId,
        productId: product.id,
        name: product.name,
        sku: selectedVariant?.sku || product.id,
        size: selectedVariant?.size,
        color: selectedVariant?.color,
        price: displayPrice,
      });
    }

    setJustAdded(true);
    toast.success(`${qty > 1 ? `${qty}x ` : ''}${product.name} agregado al carrito.`);
    setTimeout(() => setJustAdded(false), 2500);
  };

  const hasImages = product.images && product.images.length > 0;

  return (
    <div className={styles.page}>
      <Link to={`${prefix}/`} className={styles.backLink}>
        <ChevronLeft size={18} /> Volver al catálogo
      </Link>

      <div className={styles.layout}>
        <div className={styles.gallery}>
          <div className={clsx(styles.mainImage, hasImages && styles.mainImageHasPhoto)}>
            {hasImages ? (
              <img src={product.images[activeImageIndex] || product.images[0]} alt={product.name} />
            ) : (
              <span className={styles.placeholderLetter}>{product.name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className={styles.thumbnails}>
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImageIndex(i)}
                  className={clsx(styles.thumb, i === activeImageIndex && styles.thumbActive)}
                >
                  <img src={img} alt={`${product.name} thumbnail ${i}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <div className={styles.meta}>
            <div className={styles.metaRow}>
              {product.brand && <span className={styles.brand}>{product.brand}</span>}
              {product.category && <span className={styles.category}>/ {product.category}</span>}
            </div>
            <h1 className={styles.title}>{product.name}</h1>
            {product.description && <p className={styles.description}>{product.description}</p>}
          </div>

          <div className={styles.buyBox}>
            <div className={styles.priceBlock}>
              <span className={styles.price}>
                {selectedVariant ? formatCurrency(displayPrice) : priceRange}
              </span>
              {product.basePrice && product.basePrice > product.price && (
                <span className={styles.priceStrike}>{formatCurrency(product.basePrice)}</span>
              )}
              <div className={styles.stockRow}>
                <span
                  className={clsx(
                    styles.stockDot,
                    isAvailable ? styles.stockDotAvailable : styles.stockDotUnavailable,
                  )}
                />
                <span className={clsx(styles.stockText, isAvailable ? styles.stockAvailable : styles.stockUnavailable)}>
                  {isAvailable ? 'Stock Disponible' : 'Sin Stock'}
                </span>
              </div>
            </div>

            {product.variants && product.variants.length > 0 && (
              <div className={styles.variantBlock}>
                <label className={styles.variantLabel}>Variante</label>
                <div className={styles.variantList}>
                  {product.variants.map((v: any) => {
                    const isSel = selectedVariantId === v.id;
                    const noStock = v.stock === 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => !noStock && setSelectedVariantId(v.id)}
                        title={noStock ? 'Sin stock' : undefined}
                        className={clsx(
                          styles.variantBtn,
                          isSel && styles.variantBtnSelected,
                          noStock && styles.variantBtnNoStock,
                        )}
                      >
                        {v.size && v.color ? `${v.size} - ${v.color}` : v.size ? `T. ${v.size}` : v.color ? v.color : v.sku}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.cartRow}>
              <div className={styles.qtyControl}>
                <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className={styles.qtyBtn}>−</button>
                <div className={styles.qtyValue}>{qty}</div>
                <button type="button" onClick={() => setQty(qty + 1)} className={styles.qtyBtn}>+</button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isAvailable}
                className={clsx(
                  styles.addBtn,
                  justAdded ? styles.addBtnSuccess : isAvailable ? styles.addBtnAvailable : styles.addBtnDisabled,
                )}
              >
                {justAdded ? <><Check size={18} /> Agregado!</> : <><ShoppingCart size={18} /> {isAvailable ? 'Agregar al Carrito' : 'Agotado'}</>}
              </button>
            </div>
          </div>

          {product.relatedProducts && product.relatedProducts.length > 0 && (
            <div className={styles.related}>
              <h3 className={styles.relatedTitle}>También te puede interesar</h3>
              <div className={styles.relatedGrid}>
                {product.relatedProducts.map(rp => (
                  <Link key={rp.id} to={`${prefix}/product/${rp.id}`} className={styles.relatedCard}>
                    <div className={styles.relatedImage}>
                      {rp.images?.[0] ? (
                        <img src={rp.images[0]} alt={rp.name} />
                      ) : (
                        <span className={styles.relatedPlaceholder}>{rp.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className={styles.relatedBody}>
                      <p className={styles.relatedName}>{rp.name}</p>
                      <p className={styles.relatedPrice}>{formatCurrency(rp.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className={styles.trustList}>
            {[
              { icon: Truck, title: 'Envío Rápido', desc: 'Despachamos en el día a todo el país.' },
              { icon: ShieldCheck, title: 'Compra Protegida', desc: 'Seguridad SSL en todas tus transacciones.' },
              { icon: RotateCcw, title: 'Devoluciones Gratis', desc: 'Tenés 30 días para realizar cambios.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.trustItem}>
                <div className={styles.trustIcon}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className={styles.trustTitle}>{title}</p>
                  <p className={styles.trustDesc}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
