import { Outlet, Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { APP_CONFIG } from '@/config/app.config';
import { storefrontApi } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';
import styles from './StorefrontLayout.module.css';

/**
 * Public-facing storefront layout.
 * No auth required — accessible to anonymous users.
 */
export function StorefrontLayout() {
  const { data: settings } = useQuery({
    queryKey: queryKeys.storefront.settings(),
    queryFn: () => storefrontApi.getSettings(),
  });

  const storeName = settings?.storeName || APP_CONFIG.appName;

  // Apply dynamic color if available
  if (settings?.primaryColor) {
    document.documentElement.style.setProperty('--accent', settings.primaryColor);
  }

  return (
    <div className="spatial-workspace" style={{ flexDirection: 'column' }}>
      <header className={styles.headerIsland}>
        <Link to="/store" className={styles.brand}>
          <div className={styles.logoMark} aria-hidden />
          <span className={styles.brandName}>{storeName}</span>
        </Link>
        <nav className={styles.nav} aria-label="Categorías">
          <Link to="/store" className={styles.navLink}>Catálogo</Link>
        </nav>
        <div className={styles.actions}>
          <Link to="/store/cart" className={styles.iconBtn} aria-label="Carrito">
            <ShoppingBag size={18} />
          </Link>
        </div>
      </header>

      <main className={styles.canvas}>
        <Outlet context={{ settings }} />
      </main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} {storeName}. Todos los derechos reservados.</span>
      </footer>
    </div>
  );
}
