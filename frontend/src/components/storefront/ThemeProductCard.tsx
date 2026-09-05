import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Heart, MessageCircle, Zap } from 'lucide-react';
import clsx from 'clsx';
import type { StorefrontProduct } from '@/api/storefront.api';
import type { StorefrontTheme } from '@/utils/storefrontTheme';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from './ThemeProductCard.module.css';

interface ThemeProductCardProps {
  product: StorefrontProduct;
  prefix: string;
  theme?: StorefrontTheme;
  hidePrices?: boolean;
  isMobile?: boolean;
  whatsappNumber?: string;
  whatsappMessageTemplate?: string;
}

export function ThemeProductCard({
  product,
  prefix,
  theme = 'classic',
  hidePrices = false,
  isMobile = false,
  whatsappNumber = '',
  whatsappMessageTemplate = 'Hola, quiero consultar por {product_name} (SKU: {sku})',
}: ThemeProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const isAvailable = product.inStock;
  const hasImages = product.images && product.images.length > 0;
  const primaryImg = hasImages ? product.images![0] : null;
  const secondaryImg = hasImages && product.images!.length > 1 ? product.images![1] : primaryImg;

  const price = product.price || product.basePrice || 0;
  const oldPrice = product.basePrice && product.basePrice > price ? product.basePrice : null;
  const discountPct = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  // Extract unique sizes & colors from variants
  const sizes = Array.from(new Set(product.variants?.map(v => v.size).filter(Boolean))) as string[];
  const colors = Array.from(new Set(product.variants?.map(v => v.color).filter(Boolean))) as string[];
  const firstSku = product.variants?.[0]?.sku || product.id;

  // Pre-formatted WhatsApp consultation URL
  const buildWhatsAppUrl = () => {
    const rawNumber = (whatsappNumber || '').replace(/\D/g, '');
    const text = whatsappMessageTemplate
      .replace(/\{product_name\}/g, product.name)
      .replace(/\{sku\}/g, firstSku)
      .replace(/\{variant\}/g, sizes[0] || 'Estándar')
      .replace(/\{url\}/g, window.location.href);
    return rawNumber
      ? `https://wa.me/${rawNumber}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  const productUrl = `${prefix}/product/${product.id}`;

  /* ───────────────────────────────────────────────────────────────────────────
     1. MINIMALIST / CLEAN EDITORIAL (ZARA / MASSIMO DUTTI)
     ─────────────────────────────────────────────────────────────────────────── */
  if (theme === 'minimal') {
    return (
      <Link
        to={productUrl}
        className={clsx(styles.minimalCard, 'theme-product-card')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={clsx(styles.minimalImageWrap, 'theme-card-img')}>
          {primaryImg ? (
            <img
              src={isHovered && secondaryImg ? secondaryImg : primaryImg}
              alt={product.name}
              className={styles.minimalImg}
              loading="lazy"
            />
          ) : (
            <div className={styles.placeholderBox}>
              <ShoppingBag size={32} strokeWidth={1} />
              <span>{product.name.charAt(0).toUpperCase()}</span>
            </div>
          )}

          {!isAvailable && <span className={styles.minimalAgotadoBadge}>Agotado</span>}

          {!isMobile && (
            <div className={clsx(styles.minimalQuickSizes, isHovered && styles.minimalQuickSizesVisible)}>
              <span>{sizes.length > 0 ? sizes.join(' · ') : 'Ver prenda'}</span>
            </div>
          )}
        </div>

        <div className={styles.minimalBody}>
          <span className={styles.minimalCategory}>{product.brand || product.category || 'Colección'}</span>
          <h4 className={styles.minimalName}>{product.name}</h4>
          
          {hidePrices ? (
            <span className={styles.minimalWaText}>Consultar por WhatsApp</span>
          ) : (
            <p className={styles.minimalPrice}>
              {product.maxPrice && product.maxPrice > price
                ? `Desde ${formatCurrency(price)}`
                : formatCurrency(price)}
            </p>
          )}
        </div>
      </Link>
    );
  }

  /* ───────────────────────────────────────────────────────────────────────────
     2. MODERN STREETWEAR / URBAN BOLD (NIKE / ASOS)
     ─────────────────────────────────────────────────────────────────────────── */
  if (theme === 'streetwear') {
    return (
      <div
        className={clsx(styles.streetwearCard, 'theme-product-card')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={productUrl} className={clsx(styles.streetwearImageWrap, 'theme-card-img')}>
          {primaryImg ? (
            <img
              src={isHovered && secondaryImg ? secondaryImg : primaryImg}
              alt={product.name}
              className={styles.streetwearImg}
              loading="lazy"
            />
          ) : (
            <div className={styles.placeholderBoxDark}>
              <ShoppingBag size={32} />
              <span>{product.name.charAt(0).toUpperCase()}</span>
            </div>
          )}

          <div className={styles.streetwearBadges}>
            {discountPct > 0 && (
              <span className={styles.streetwearSaleBadge}>-{discountPct}% OFF</span>
            )}
            {!isAvailable ? (
              <span className={styles.streetwearAgotadoBadge}>SIN STOCK</span>
            ) : discountPct === 0 ? (
              <span className={styles.streetwearDropBadge}>NEW DROP</span>
            ) : null}
          </div>
        </Link>

        <div className={styles.streetwearBody}>
          <div>
            <span className={styles.streetwearCategory}>{product.brand || 'STREETWEAR'}</span>
            <Link to={productUrl} className={styles.streetwearNameLink}>
              <h4 className={styles.streetwearName}>{product.name}</h4>
            </Link>

            {hidePrices ? (
              <div className={styles.streetwearWaPrice}>Precio a consultar</div>
            ) : (
              <div className={styles.streetwearPriceRow}>
                <span className={styles.streetwearPrice}>{formatCurrency(price)}</span>
                {oldPrice && <span className={styles.streetwearOldPrice}>{formatCurrency(oldPrice)}</span>}
              </div>
            )}
          </div>

          <div className={styles.streetwearActionRow}>
            {hidePrices ? (
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.streetwearWaBtn}
                title="Consultar por WhatsApp"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            ) : (
              <Link to={productUrl} className={styles.streetwearBuyBtn}>
                <Zap size={14} /> {isAvailable ? 'COMPRAR' : 'VER'}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ───────────────────────────────────────────────────────────────────────────
     3. CATALOG-FIRST / QUICK-SHOP HIGH DENSITY (MAYORISTA / WHATSAPP)
     ─────────────────────────────────────────────────────────────────────────── */
  if (theme === 'catalog') {
    return (
      <div className={clsx(styles.catalogCard, 'theme-product-card')}>
        <Link to={productUrl} className={clsx(styles.catalogImageWrap, 'theme-card-img')}>
          {primaryImg ? (
            <img src={primaryImg} alt={product.name} className={styles.catalogImg} loading="lazy" />
          ) : (
            <div className={styles.placeholderBox}>
              <ShoppingBag size={28} />
              <span>{product.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className={styles.catalogSkuBadge}>SKU: {firstSku}</span>
          {!isAvailable && <span className={styles.catalogAgotadoBadge}>Agotado</span>}
        </Link>

        <div className={styles.catalogBody}>
          <Link to={productUrl} className={styles.catalogNameLink}>
            <h4 className={styles.catalogName}>{product.name}</h4>
          </Link>

          {hidePrices ? (
            <span className={styles.catalogWaText}>Consultar precio</span>
          ) : (
            <div className={styles.catalogPriceRow}>
              <span className={styles.catalogPrice}>{formatCurrency(price)}</span>
              {oldPrice && <span className={styles.catalogOldPrice}>{formatCurrency(oldPrice)}</span>}
            </div>
          )}

          {/* Direct Size Chips */}
          {sizes.length > 0 && (
            <div className={styles.catalogSizesRow}>
              <span className={styles.catalogSizesLabel}>Talles:</span>
              <div className={styles.catalogChips}>
                {sizes.slice(0, 4).map(s => (
                  <span key={s} className={styles.catalogSizeChip}>{s}</span>
                ))}
                {sizes.length > 4 && <span className={styles.catalogMoreChip}>+{sizes.length - 4}</span>}
              </div>
            </div>
          )}

          {/* Direct Color Circles */}
          {colors.length > 0 && (
            <div className={styles.catalogColorsRow}>
              <span className={styles.catalogSizesLabel}>Colores:</span>
              <div className={styles.catalogColorDots}>
                {colors.slice(0, 3).map(c => (
                  <span key={c} className={styles.catalogColorDot} title={c}>
                    {c.charAt(0).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.catalogActions}>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.catalogWaBtn}
              title="Pedir o consultar por WhatsApp"
            >
              <MessageCircle size={14} /> Consultar WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ───────────────────────────────────────────────────────────────────────────
     4. APP-LIKE / MOBILE-NATIVE FIRST (INSTAGRAM SHOP)
     ─────────────────────────────────────────────────────────────────────────── */
  if (theme === 'app_like') {
    return (
      <div className={clsx(styles.appLikeCard, 'theme-product-card')}>
        <div className={clsx(styles.appLikeImageWrap, 'theme-card-img')}>
          <Link to={productUrl} className={styles.appLikeImgLink}>
            {primaryImg ? (
              <img src={primaryImg} alt={product.name} className={styles.appLikeImg} loading="lazy" />
            ) : (
              <div className={styles.placeholderBox}>
                <ShoppingBag size={32} />
                <span>{product.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
          </Link>

          {/* Floating Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsLiked(!isLiked);
            }}
            className={clsx(styles.appLikeHeartBtn, isLiked && styles.appLikeHeartActive)}
            aria-label="Guardar en favoritos"
          >
            <Heart size={16} fill={isLiked ? '#ec4899' : 'none'} color={isLiked ? '#ec4899' : '#64748b'} />
          </button>

          {!isAvailable && <span className={styles.appLikeAgotadoBadge}>Agotado</span>}
        </div>

        <div className={styles.appLikeBody}>
          <span className={styles.appLikeCategory}>{product.brand || product.category || 'Tienda'}</span>
          <Link to={productUrl} className={styles.appLikeNameLink}>
            <h4 className={styles.appLikeName}>{product.name}</h4>
          </Link>

          {hidePrices ? (
            <div className={styles.appLikeWaText}>Consultar por WhatsApp</div>
          ) : (
            <div className={styles.appLikePriceRow}>
              <span className={styles.appLikePrice}>{formatCurrency(price)}</span>
              {oldPrice && <span className={styles.appLikeOldPrice}>{formatCurrency(oldPrice)}</span>}
            </div>
          )}

          <div className={styles.appLikeBtnRow}>
            {hidePrices ? (
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.appLikeWaBtn}
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            ) : (
              <Link to={productUrl} className={styles.appLikeAddBtn}>
                <ShoppingCart size={13} /> {isAvailable ? 'Añadir' : 'Ver'}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ───────────────────────────────────────────────────────────────────────────
     5. CLASSIC (PRESERVED ORIGINAL)
     ─────────────────────────────────────────────────────────────────────────── */
  return (
    <Link to={productUrl} className={clsx(styles.classicCard, 'theme-product-card')}>
      <div className={clsx(styles.classicImageArea, 'theme-card-img')}>
        {primaryImg ? (
          <img src={primaryImg} alt={product.name} className={styles.classicProductImage} loading="lazy" />
        ) : (
          <div className={styles.classicPlaceholder}>
            <ShoppingBag size={48} color="var(--text-primary)" />
            <span className={styles.classicPlaceholderLetter}>{product.name.charAt(0).toUpperCase()}</span>
          </div>
        )}

        <div className={styles.classicBadges}>
          {!isAvailable && <span className={styles.classicSoldOut}>Agotado</span>}
        </div>

        {!isMobile && (
          <div className={styles.classicQuickAdd}>
            {hidePrices ? 'Consultar' : 'Ver Detalles'}
          </div>
        )}
      </div>

      <div className={styles.classicProductBody}>
        <span className={styles.classicCategoryLabel}>
          {product.brand || product.category || 'Categoría'}
        </span>
        <h3 className={styles.classicProductName}>{product.name}</h3>
        {hidePrices ? (
          <p className={styles.classicProductWaPrice}>
            Consultar por WhatsApp
          </p>
        ) : (
          <p className={styles.classicProductPrice}>
            {product.maxPrice && product.maxPrice > price
              ? `Desde ${formatCurrency(price)}`
              : formatCurrency(price)}
          </p>
        )}
      </div>
    </Link>
  );
}
