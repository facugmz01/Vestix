import { useState, useEffect, type ImgHTMLAttributes, type ReactNode } from 'react';
import { normalizeImageUrl } from '@/utils/imageUrl';

export interface SafeImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallback?: ReactNode;
}

export function SafeImage({
  src,
  alt = '',
  className,
  fallback = null,
  loading = 'lazy',
  onError,
  ...rest
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const cleanSrc = normalizeImageUrl(src);

  useEffect(() => {
    setHasError(false);
  }, [cleanSrc]);

  if (!cleanSrc || hasError) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={cleanSrc}
      alt={alt}
      className={className}
      loading={loading}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}

export default SafeImage;
