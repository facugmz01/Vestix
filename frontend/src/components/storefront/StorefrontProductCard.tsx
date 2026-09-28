import React from 'react';
import type { StorefrontProduct } from '@/api/storefront.api';
import type { StorefrontTheme } from '@/utils/storefrontTheme';
import { ThemeProductCard } from './ThemeProductCard';
export { ProgressiveProductImage } from './ProgressiveProductImage';
export type { ProgressiveProductImageProps } from './ProgressiveProductImage';

export interface StorefrontProductCardProps {
  product: StorefrontProduct;
  prefix: string;
  theme?: StorefrontTheme;
  hidePrices?: boolean;
  isMobile?: boolean;
  whatsappNumber?: string;
  whatsappMessageTemplate?: string;
}

export function StorefrontProductCard(props: StorefrontProductCardProps) {
  return <ThemeProductCard {...props} />;
}

export default StorefrontProductCard;
