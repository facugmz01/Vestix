import clsx from 'clsx';
import styles from './storefront.module.css';

type Props = {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
};

export function StorefrontCard({ children, className, padded = true }: Props) {
  return (
    <div className={clsx(styles.card, padded && styles.cardPad, 'animate-fade', className)}>
      {children}
    </div>
  );
}
