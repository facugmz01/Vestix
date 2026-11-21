import React from 'react';
import type { StorefrontProduct } from '@/api/storefront.api';
import { ThemeProductCard } from './ThemeProductCard';
export { ProgressiveProductImage } from './ProgressiveProductImage';
export type { ProgressiveProductImageProps } from './ProgressiveProductImage';

export interface StorefrontProductCardProps {
  product: StorefrontProduct;
  prefix: string;
  hidePrices?: boolean;
  whatsappNumber?: string;
  whatsappMessageTemplate?: string;
}

export function StorefrontProductCard(props: StorefrontProductCardProps) {
  return <ThemeProductCard {...props} />;
}

export default StorefrontProductCard;
