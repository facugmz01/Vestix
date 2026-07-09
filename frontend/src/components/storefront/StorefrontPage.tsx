import clsx from 'clsx';
import styles from './storefront.module.css';

type Props = {
  children: React.ReactNode;
  variant?: 'default' | 'narrow' | 'medium';
  className?: string;
};

export function StorefrontPage({ children, variant = 'default', className }: Props) {
  const variantClass =
    variant === 'narrow' ? styles.pageNarrow :
    variant === 'medium' ? styles.pageMedium :
    styles.page;

  return <div className={clsx(variantClass, className)}>{children}</div>;
}
