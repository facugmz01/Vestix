import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ShoppingCart, ShieldCheck, Truck, RotateCcw, Check, Maximize2, X } from 'lucide-react';
import clsx from 'clsx';
import { storefrontApi, type StorefrontSettings } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import { WhatsAppInquiryButton } from '@/components/storefront';
import styles from './OnlineProductDetailPage.module.css';

export default function OnlineProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const prefix = storePrefix();
  const addItem = useCartStore(s => s.addItem);
  const { settings } = useOutletContext<{ settings?: StorefrontSettings }>();
  const hidePrices = Boolean(settings?.hidePrices);

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const thumbnailTrackRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  const { data: product, isLoading } = useQuery({
    queryKey: queryKeys.storefront.product(id!),
    queryFn: () => storefrontApi.getProduct(id!),
    enabled: !!id,
  });

  const productImages = product?.images || [];
  const hasImages = productImages.length > 0;
  const totalImages = productImages.length;

  const handlePrevImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
  }, [totalImages]);

  const handleNextImage = useCallback(() => {
    setActiveImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
  }, [totalImages]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null) return;
    const threshold = 40;
    if (touchDeltaXRef.current > threshold) {
      handlePrevImage();
    } else if (touchDeltaXRef.current < -threshold) {
      handleNextImage();
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  // Keyboard navigation when Lightbox is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    };
    if (isLightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isLightboxOpen, handlePrevImage, handleNextImage]);

  // Reset active image if out of bounds
  useEffect(() => {
    if (activeImageIndex >= totalImages && totalImages > 0) {
      setActiveImageIndex(0);
    }
  }, [totalImages, activeImageIndex]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailTrackRef.current) {
      const activeEl = thumbnailTrackRef.current.children[activeImageIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeImageIndex]);

  const handleScrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailTrackRef.current) {
      const scrollAmount = 220;
      thumbnailTrackRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

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

  return (
    <div className={styles.page}>
      <Link to={`${prefix}/`} className={styles.backLink}>
        <ChevronLeft size={18} /> Volver al catálogo
      </Link>

      <div className={styles.layout}>
        <div className={styles.gallery}>
          <div
            className={styles.mainImageWrapper}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className={clsx(styles.mainImage, hasImages && styles.mainImageHasPhoto)}
              onClick={() => hasImages && setIsLightboxOpen(true)}
              role={hasImages ? 'button' : undefined}
              tabIndex={hasImages ? 0 : undefined}
              title={hasImages ? 'Ampliar imagen' : undefined}
            >
              {hasImages ? (
                <img src={productImages[activeImageIndex] || productImages[0]} alt={product.name} />
              ) : (
                <span className={styles.placeholderLetter}>{product.name.charAt(0).toUpperCase()}</span>
              )}
            </div>

            {hasImages && totalImages > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className={clsx(styles.mainNavBtn, styles.mainNavBtnPrev)}
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className={clsx(styles.mainNavBtn, styles.mainNavBtnNext)}
                  aria-label="Siguiente imagen"
                >
                  <ChevronRight size={20} />
                </button>
                <div className={styles.badgeCounter}>
                  {activeImageIndex + 1} / {totalImages}
                </div>
              </>
            )}

            {hasImages && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                className={styles.zoomBtn}
                aria-label="Ampliar imagen"
                title="Ampliar imagen"
              >
                <Maximize2 size={16} />
              </button>
            )}
          </div>

          {totalImages > 1 && (
            <div className={styles.thumbnailsWrapper}>
              <button
                type="button"
                onClick={() => handleScrollThumbnails('left')}
                className={styles.thumbArrowBtn}
                aria-label="Desplazar miniaturas hacia la izquierda"
              >
                <ChevronLeft size={16} />
              </button>

              <div ref={thumbnailTrackRef} className={styles.thumbnailsTrack}>
                {productImages.map((img: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImageIndex(i)}
                    className={clsx(styles.thumb, i === activeImageIndex && styles.thumbActive)}
                    aria-label={`Ver foto ${i + 1} de ${product.name}`}
                  >
                    <img src={img} alt="" loading="lazy" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleScrollThumbnails('right')}
                className={styles.thumbArrowBtn}
                aria-label="Desplazar miniaturas hacia la derecha"
              >
                <ChevronRight size={16} />
              </button>
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
              {hidePrices ? (
                <span style={{ color: '#16a34a', fontSize: '1.25rem', fontWeight: 700 }}>
                  Consultar Precio
                </span>
              ) : (
                <>
                  <span className={styles.price}>
                    {selectedVariant ? formatCurrency(displayPrice) : priceRange}
                  </span>
                  {product.basePrice && product.basePrice > product.price && (
                    <span className={styles.priceStrike}>{formatCurrency(product.basePrice)}</span>
                  )}
                </>
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

            {hidePrices ? (
              <div style={{ marginTop: '8px', width: '100%' }}>
                <WhatsAppInquiryButton
                  product={product}
                  variant={selectedVariant}
                  whatsappNumber={settings?.whatsappNumber || settings?.whatsapp}
                  messageTemplate={settings?.whatsappMessageTemplate}
                  size="lg"
                  className="w-full"
                  label="Consultar por WhatsApp"
                />
              </div>
            ) : (
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
            )}
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
                      {hidePrices ? (
                        <p className={styles.relatedPrice} style={{ color: '#16a34a', fontWeight: 600 }}>
                          Consultar
                        </p>
                      ) : (
                        <p className={styles.relatedPrice}>{formatCurrency(rp.price)}</p>
                      )}
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

      {/* Lightbox / Fullscreen Modal */}
      {isLightboxOpen && hasImages && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.lightboxCloseBtn}
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Cerrar vista ampliada"
            >
              <X size={24} />
            </button>

            <div className={styles.lightboxImageWrap}>
              <img
                src={productImages[activeImageIndex] || productImages[0]}
                alt={product.name}
                className={styles.lightboxImage}
              />
            </div>

            {totalImages > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className={clsx(styles.lightboxNavBtn, styles.lightboxNavBtnPrev)}
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className={clsx(styles.lightboxNavBtn, styles.lightboxNavBtnNext)}
                  aria-label="Siguiente imagen"
                >
                  <ChevronRight size={28} />
                </button>
                <div className={styles.lightboxCounter}>
                  {activeImageIndex + 1} / {totalImages}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
