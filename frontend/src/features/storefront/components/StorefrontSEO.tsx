import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storefrontApi } from '@/api/storefront.api';
import { storePrefix } from '@/utils/storefrontDomain';

interface StorefrontSEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export function StorefrontSEO({ title, description, image, url }: StorefrontSEOProps) {
  const prefix = storePrefix();
  
  const { data: settings } = useQuery({
    queryKey: ['storefrontSettings', prefix],
    queryFn: () => storefrontApi.getSettings(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    // Determine final values, fallback to store settings
    const finalTitle = title ? `${title} | ${settings?.storeName || 'Tienda'}` : (settings?.storeName || 'Tienda Online');
    const finalDescription = description || 'Descubrí nuestros productos.';
    const finalImage = image || '/og-image.png';
    const finalUrl = url || window.location.href;

    // Update standard tags
    document.title = finalTitle;
    
    // Helper to update or create meta tags
    const setMetaTag = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.startsWith('meta[name=')) {
          element.setAttribute('name', selector.match(/meta\[name="(.*?)"\]/)?.[1] || '');
        } else if (selector.startsWith('meta[property=')) {
          element.setAttribute('property', selector.match(/meta\[property="(.*?)"\]/)?.[1] || '');
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    setMetaTag('meta[name="description"]', 'content', finalDescription);
    
    // OpenGraph
    setMetaTag('meta[property="og:title"]', 'content', finalTitle);
    setMetaTag('meta[property="og:description"]', 'content', finalDescription);
    setMetaTag('meta[property="og:image"]', 'content', finalImage);
    setMetaTag('meta[property="og:url"]', 'content', finalUrl);
    setMetaTag('meta[property="og:type"]', 'content', 'website');

    // Twitter
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'content', finalTitle);
    setMetaTag('meta[name="twitter:description"]', 'content', finalDescription);
    setMetaTag('meta[name="twitter:image"]', 'content', finalImage);

  }, [title, description, image, url, settings]);

  return null;
}
