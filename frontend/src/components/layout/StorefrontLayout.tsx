import { Outlet, Link } from 'react-router-dom';
import { ShoppingBag, Search } from 'lucide-react';
import { APP_CONFIG } from '@/config/app.config';
import styles from './StorefrontLayout.module.css';

/**
 * Public-facing storefront layout.
 * No auth required — accessible to anonymous users.
 */
export function StorefrontLayout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link to="/catalog" className={styles.brand}>
            <div className={styles.logoMark} aria-hidden />
            <span className={styles.brandName}>{APP_CONFIG.appName}</span>
          </Link>
          <nav className={styles.nav} aria-label="Categorías">
            <Link to="/catalog" className={styles.navLink}>Todos</Link>
            <Link to="/catalog?category=remeras" className={styles.navLink}>Remeras</Link>
            <Link to="/catalog?category=pantalones" className={styles.navLink}>Pantalones</Link>
            <Link to="/catalog?category=accesorios" className={styles.navLink}>Accesorios</Link>
          </nav>
          <div className={styles.actions}>
            <button className={styles.iconBtn} aria-label="Buscar"><Search size={18} /></button>
            <button className={styles.iconBtn} aria-label="Carrito"><ShoppingBag size={18} /></button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} {APP_CONFIG.appName}. Todos los derechos reservados.</span>
      </footer>
    </div>
  );
}
