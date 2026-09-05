import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, MessageCircle, ShoppingBag } from 'lucide-react';
import clsx from 'clsx';
import styles from './ThemeBottomNav.module.css';

interface ThemeBottomNavProps {
  prefix: string;
  whatsappNumber?: string;
  hidePrices?: boolean;
  totalItems?: number;
}

export function ThemeBottomNav({
  prefix,
  whatsappNumber = '',
  hidePrices = false,
  totalItems = 0,
}: ThemeBottomNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const isHome = currentPath === `${prefix}/` || currentPath === `${prefix}`;
  const isCart = currentPath.startsWith(`${prefix}/cart`);

  const cleanWhatsAppNumber = whatsappNumber.replace(/\D/g, '');
  const waUrl = cleanWhatsAppNumber
    ? `https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent('Hola, me comunico desde la tienda online.')}`
    : '#';

  return (
    <nav className={styles.bottomBar} aria-label="Navegación móvil">
      <Link to={`${prefix}/`} className={clsx(styles.navItem, isHome && styles.navItemActive)}>
        <Home size={20} strokeWidth={isHome ? 2.5 : 1.75} />
        <span className={styles.label}>Inicio</span>
      </Link>

      <Link to={`${prefix}/`} className={styles.navItem}>
        <LayoutGrid size={20} strokeWidth={1.75} />
        <span className={styles.label}>Catálogo</span>
      </Link>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(styles.navItem, styles.waItem)}
        title="Consultar por WhatsApp"
      >
        <MessageCircle size={20} strokeWidth={2} />
        <span className={styles.label}>WhatsApp</span>
      </a>

      {!hidePrices && (
        <Link to={`${prefix}/cart`} className={clsx(styles.navItem, isCart && styles.navItemActive)}>
          <div className={styles.iconWrap}>
            <ShoppingBag size={20} strokeWidth={isCart ? 2.5 : 1.75} />
            {totalItems > 0 && (
              <span className={styles.badge}>{totalItems > 99 ? '99+' : totalItems}</span>
            )}
          </div>
          <span className={styles.label}>Carrito</span>
        </Link>
      )}
    </nav>
  );
}
