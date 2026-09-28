import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Shirt, Package } from 'lucide-react';
import styles from './ThemeProductCard.module.css';

export interface ProgressiveProductImageProps {
  src?: string | null;
  secondarySrc?: string | null;
  isHovered?: boolean;
  alt: string;
  className?: string;
  imgClassName?: string;
  dark?: boolean;
  productName?: string;
  fallbackIcon?: 'shirt' | 'package';
  loading?: 'lazy' | 'eager';
}

export function ProgressiveProductImage({
  src,
  secondarySrc,
  isHovered = false,
  alt,
  className,
  imgClassName,
  dark = false,
  productName,
  fallbackIcon = 'shirt',
  loading = 'lazy',
}: ProgressiveProductImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Active source depends on hover state
  const activeSrc = isHovered && secondarySrc ? secondarySrc : src;

  // Reset loading & error state whenever target image URL changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [activeSrc]);

  const Icon = fallbackIcon === 'package' ? Package : Shirt;

  if (!activeSrc || hasError) {
    return (
      <div
        className={clsx(
          styles.fallbackPlaceholder,
          dark && styles.fallbackPlaceholderDark,
          className
        )}
        aria-label={alt || 'Imagen de producto no disponible'}
      >
        <div
          className={clsx(
            styles.fallbackIconWrap,
            dark && styles.fallbackIconWrapDark
          )}
        >
          <Icon size={26} strokeWidth={1.5} />
        </div>
        <span className={styles.fallbackText}>
          {productName ? productName.slice(0, 18) : 'Sin Imagen'}
        </span>
      </div>
    );
  }

  return (
    <div className={clsx(styles.progressiveImageContainer, className)}>
      {/* Animated shimmer skeleton while loading */}
      {!isLoaded && (
        <div
          className={clsx(
            styles.imageSkeleton,
            dark && styles.imageSkeletonDark
          )}
          aria-hidden
        />
      )}

      <img
        src={activeSrc}
        alt={alt}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={clsx(
          styles.progressiveImg,
          isLoaded ? styles.progressiveImgLoaded : styles.progressiveImgLoading,
          imgClassName
        )}
      />
    </div>
  );
}

export default ProgressiveProductImage;
