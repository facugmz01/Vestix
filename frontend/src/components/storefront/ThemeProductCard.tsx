import { Link } from 'react-router-dom';
import { MessageCircle, ShoppingBag } from 'lucide-react';
import type { StorefrontProduct } from '@/api/storefront.api';
import { formatCurrency } from '@/utils/formatCurrency';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { ProgressiveProductImage } from './ProgressiveProductImage';
import styles from './ThemeProductCard.module.css';

interface ThemeProductCardProps {
  product: StorefrontProduct;
  prefix: string;
  hidePrices?: boolean;
  whatsappNumber?: string;
  whatsappMessageTemplate?: string;
}

/** Single storefront card. Legacy visual variants intentionally do not exist anymore. */
export function ThemeProductCard({
  product,
  prefix,
  hidePrices = false,
  whatsappNumber = '',
  whatsappMessageTemplate = 'Hola, quiero consultar por {product_name} (SKU: {sku})',
}: ThemeProductCardProps) {
  const images = Array.isArray(product.images)
    ? product.images.map(normalizeImageUrl).filter((image): image is string => Boolean(image))
    : [];
  const sku = product.variants?.[0]?.sku || product.id;
  const price = product.price || product.basePrice || 0;
  const oldPrice = product.basePrice && product.basePrice > price ? product.basePrice : null;
  const number = whatsappNumber.replace(/\D/g, '');
  const message = whatsappMessageTemplate
    .replace(/\{product_name\}/g, product.name)
    .replace(/\{sku\}/g, sku)
    .replace(/\{url\}/g, window.location.href);
  const whatsappUrl = `${number ? `https://wa.me/${number}` : 'https://wa.me/'}?text=${encodeURIComponent(message)}`;

  return (
    <article className={styles.editorialCard}>
      <Link to={`${prefix}/product/${product.id}`} className={styles.editorialCardLink}>
        <div className={styles.editorialCardImage}>
          <ProgressiveProductImage
            src={images[0] || null}
            secondarySrc={images[1] || images[0] || null}
            alt={product.name}
            productName={product.name}
            imgClassName={styles.editorialCardImg}
            fallbackIcon="shirt"
          />
          {!product.inStock && <span className={styles.editorialCardBadge}>Agotado</span>}
        </div>
        <div className={styles.editorialCardBody}>
          <span className={styles.editorialCardMeta}>{product.brand || 'Vestix'}</span>
          <h3 className={styles.editorialCardTitle}>{product.name}</h3>
          {!hidePrices && (
            <div className={styles.editorialCardPrice}>
              {oldPrice && <del>{formatCurrency(oldPrice)}</del>}
              <strong>{formatCurrency(price)}</strong>
            </div>
          )}
        </div>
      </Link>
      {hidePrices ? (
        <a className={styles.editorialCardCta} href={whatsappUrl} target="_blank" rel="noreferrer">
          <MessageCircle size={16} aria-hidden /> Consultar por WhatsApp
        </a>
      ) : (
        <Link className={styles.editorialCardCta} to={`${prefix}/product/${product.id}`}>
          <ShoppingBag size={16} aria-hidden /> Ver producto
        </Link>
      )}
    </article>
  );
}
