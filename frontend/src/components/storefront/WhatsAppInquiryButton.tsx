import React from 'react';
import clsx from 'clsx';
import type { StorefrontProduct, StorefrontVariant } from '@/api/storefront.api';

export interface WhatsAppInquiryButtonProps {
  product: {
    id: string;
    name: string;
    sku?: string;
    variants?: StorefrontVariant[];
  };
  variant?: StorefrontVariant | null;
  whatsappNumber?: string;
  messageTemplate?: string;
  label?: string;
  className?: string;
  variantStyle?: 'primary' | 'outline' | 'compact' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function buildWhatsAppInquiryUrl(params: {
  product: { id: string; name: string; sku?: string; variants?: StorefrontVariant[] };
  variant?: StorefrontVariant | null;
  whatsappNumber?: string;
  messageTemplate?: string;
  currentUrl?: string;
}): string {
  const { product, variant, whatsappNumber = '', messageTemplate, currentUrl } = params;
  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  if (!cleanNumber) return '#';

  const defaultTemplate = 'Hola, quiero consultar el precio de {product_name} (SKU: {sku})';
  const template = messageTemplate?.trim() || defaultTemplate;

  const sku = variant?.sku || product.variants?.[0]?.sku || product.sku || product.id;
  const variantParts = [variant?.size ? `Talle: ${variant.size}` : '', variant?.color ? `Color: ${variant.color}` : '']
    .filter(Boolean)
    .join(', ');
  const variantLabel = variantParts || (variant?.sku ? `SKU: ${variant.sku}` : '');

  const pageUrl = currentUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const message = template
    .replace(/\{product_name\}/g, product.name)
    .replace(/\{sku\}/g, sku)
    .replace(/\{variant\}/g, variantLabel || 'Estándar')
    .replace(/\{url\}/g, pageUrl);

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message.trim())}`;
}

export function WhatsAppIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.82 11.82 0 00-3.468-8.414" />
    </svg>
  );
}

export function WhatsAppInquiryButton({
  product,
  variant,
  whatsappNumber,
  messageTemplate,
  label = 'Consultar por WhatsApp',
  className,
  variantStyle = 'primary',
  size = 'md',
  showIcon = true,
  onClick,
}: WhatsAppInquiryButtonProps) {
  const href = buildWhatsAppInquiryUrl({
    product,
    variant,
    whatsappNumber,
    messageTemplate,
  });

  const isConfigured = href !== '#';

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isConfigured) {
      e.preventDefault();
      alert('Número de WhatsApp no configurado aún en la tienda.');
      return;
    }
    if (onClick) onClick(e);
  };

  const sizeStyles = {
    sm: {
      padding: '8px 14px',
      fontSize: '13px',
      minHeight: '36px',
      gap: '6px',
    },
    md: {
      padding: '10px 18px',
      fontSize: '14px',
      minHeight: '42px',
      gap: '8px',
    },
    lg: {
      padding: '12px 20px',
      fontSize: '15px',
      minHeight: '48px',
      gap: '8px',
    },
  }[size];

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  }[size];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      title={label}
      aria-label={`${label} para ${product.name}`}
      className={clsx(
        'storefront-whatsapp-btn',
        className,
      )}
      style={{
        backgroundColor: variantStyle === 'primary' ? '#25D366' : variantStyle === 'secondary' ? '#128C7E' : '#ffffff',
        color: variantStyle === 'outline' ? '#128C7E' : '#ffffff',
        border: variantStyle === 'outline' ? '1.5px solid #25D366' : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        fontWeight: 700,
        borderRadius: '8px',
        textDecoration: 'none',
        cursor: 'pointer',
        boxSizing: 'border-box',
        boxShadow: variantStyle === 'primary' ? '0 2px 6px rgba(37, 211, 102, 0.28)' : 'none',
        transition: 'background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease',
        ...sizeStyles,
      }}
      onMouseEnter={(e) => {
        if (variantStyle === 'primary') {
          e.currentTarget.style.backgroundColor = '#20bd5a';
        } else if (variantStyle === 'outline') {
          e.currentTarget.style.backgroundColor = '#f0fdf4';
        }
      }}
      onMouseLeave={(e) => {
        if (variantStyle === 'primary') {
          e.currentTarget.style.backgroundColor = '#25D366';
        } else if (variantStyle === 'outline') {
          e.currentTarget.style.backgroundColor = '#ffffff';
        }
      }}
    >
      {showIcon && <WhatsAppIcon size={iconSizes} />}
      <span>{label}</span>
    </a>
  );
}

