import { Outlet, Link, useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LogIn, ChevronDown, ChevronUp, Loader2, UserCircle, Search, MapPin, Phone, Mail, Globe2, Building2 } from 'lucide-react';
import { Suspense, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/store/cart.store';
import { useStorefrontAuthStore } from '@/store/storefrontAuth.store';
import { storePrefix } from '@/utils/storefrontDomain';
import { storefrontApi } from '@/api/storefront.api';
import { buildStorefrontThemeCss } from '@/utils/storefrontTheme';
import { StorefrontSearchBar } from '@/components/storefront';
import clsx from 'clsx';
import styles from './StorefrontLayout.module.css';

export default function StorefrontLayout() {
  const totalItems = useCartStore(s => s.totalItems());
  const prefix = storePrefix();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const isCatalogRoute = location.pathname === prefix || location.pathname === `${prefix}/`;

  const { data: settings, isLoading } = useQuery({
    queryKey: ['storefrontSettings', prefix],
    queryFn: () => storefrontApi.getSettings(),
  });

  const { customer, isAuthenticated, loadCurrentCustomer, logout } = useStorefrontAuthStore();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchDockExpanded, setSearchDockExpanded] = useState(window.innerWidth >= 768);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchDockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboardInset = () => {
      const keyboardInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      document.documentElement.style.setProperty('--storefront-keyboard-inset', `${keyboardInset}px`);
    };

    updateKeyboardInset();
    viewport.addEventListener('resize', updateKeyboardInset);
    viewport.addEventListener('scroll', updateKeyboardInset);

    return () => {
      viewport.removeEventListener('resize', updateKeyboardInset);
      viewport.removeEventListener('scroll', updateKeyboardInset);
      document.documentElement.style.removeProperty('--storefront-keyboard-inset');
    };
  }, []);

  const previousLocationRef = useRef(`${location.pathname}${location.search}`);
  const lastScrollPositionRef = useRef(0);
  const scrollStorageKey = `vestix:storefront-scroll:${prefix}`;

  useEffect(() => {
    const isCatalog = location.pathname === `${prefix}/` || location.pathname === prefix;
    if (!isCatalog) return;

    const saveScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      lastScrollPositionRef.current = scrollTop;
      sessionStorage.setItem(scrollStorageKey, String(scrollTop));
    };
    window.addEventListener('scroll', saveScroll, { passive: true });
    return () => window.removeEventListener('scroll', saveScroll);
  }, [location.pathname, prefix, scrollStorageKey]);

  useEffect(() => {
    const currentLocation = `${location.pathname}${location.search}`;
    const previousLocation = previousLocationRef.current;
    const catalogPath = `${prefix}/`;
    const isCatalog = location.pathname === catalogPath || location.pathname === prefix;
    const wasCatalog = previousLocation.startsWith(catalogPath);

    // Capture the catalog position before opening a product. This works for
    // product links as well as browser/device back navigation.
    if (wasCatalog && location.pathname.includes('/product/')) {
      sessionStorage.setItem(scrollStorageKey, String(lastScrollPositionRef.current));
    }

    if (isCatalog && navigationType === 'POP') {
      const savedScroll = Number(sessionStorage.getItem(scrollStorageKey) || 0);
      const restore = () => {
        document.documentElement.scrollTop = savedScroll;
        document.body.scrollTop = savedScroll;
        window.scrollTo(0, savedScroll);
        lastScrollPositionRef.current = savedScroll;
      };
      requestAnimationFrame(restore);
      window.setTimeout(restore, 250);
      window.setTimeout(restore, 650);
    } else if (!isCatalog) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    previousLocationRef.current = currentLocation;
  }, [location.pathname, location.search, navigationType, prefix, scrollStorageKey]);

  useEffect(() => {
    loadCurrentCustomer();
  }, [loadCurrentCustomer]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate(`${prefix}/`);
  };

  const primaryColor = settings?.primaryColor || '#0066CC';
  const fontFamily = settings?.fontFamily || 'var(--font-sans)';
  const storeName = settings?.storeName || 'ERPStore';
  const showStoreName = settings?.showStoreName !== false;

  const displayName = customer?.fullName
    ? customer.fullName.length > 14
      ? customer.fullName.slice(0, 14) + '…'
      : customer.fullName
    : customer?.phone || 'Mi Cuenta';

  const shellRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (shellRef.current) shellRef.current.style.fontFamily = fontFamily;
  }, [fontFamily]);

  // A single public storefront system is intentionally used everywhere.
  const theme = 'editorial' as const;
  const isStorefrontLogin = location.pathname.endsWith('/login');
  const companyInfo = settings?.companyInfo;
  const companyAddress = [companyInfo?.address, companyInfo?.city, companyInfo?.province]
    .filter(Boolean)
    .join(', ');

  return (
    <div ref={shellRef} className={clsx(styles.shell, `storefront-theme-${theme}`)}>
      <style>{buildStorefrontThemeCss(primaryColor)}</style>

      <a className={styles.skipLink} href="#storefront-content">Saltar al contenido</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to={`${prefix}/`} className={styles.logo}>
            <div className={styles.logoMark}>{storeName.charAt(0).toUpperCase()}</div>
            {showStoreName && <span className={styles.logoName}>{storeName}</span>}
          </Link>

          <div className={styles.navControls}>
            {isAuthenticated && customer ? (
              <div ref={menuRef} className={styles.userMenu}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(o => !o)}
                  className={styles.navBtn}
                  aria-label="Menú de usuario"
                  aria-expanded={userMenuOpen}
                >
                  <User size={16} />
                  {!isMobile && <span>{displayName}</span>}
                  <ChevronDown
                    size={14}
                    className={`${styles.chevron} ${userMenuOpen ? styles.chevronOpen : ''}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.dropdownGreeting}>Hola,</div>
                      <div className={styles.dropdownName}>{customer.fullName}</div>
                      {customer.phone && (
                        <div className={styles.dropdownPhone}>+{customer.phone}</div>
                      )}
                    </div>
                    <Link
                      to={`${prefix}/my-orders`}
                      onClick={() => setUserMenuOpen(false)}
                      className={styles.dropdownLink}
                    >
                      <User size={15} /> Mis pedidos
                    </Link>
                    <Link
                      to={`${prefix}/profile`}
                      onClick={() => setUserMenuOpen(false)}
                      className={styles.dropdownLink}
                    >
                      <UserCircle size={15} /> Mis datos
                    </Link>
                    <button type="button" onClick={handleLogout} className={styles.dropdownAction}>
                      <LogOut size={15} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to={`${prefix}/login`} className={styles.navBtn} title="Iniciar sesión">
                <LogIn size={16} />
                {!isMobile && <span>Ingresar</span>}
              </Link>
            )}

            {!settings?.hidePrices && (
              <Link to={`${prefix}/cart`} className={styles.cartLink} title="Carrito de compras">
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className={styles.cartBadge}>
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

      </header>

      {!isStorefrontLogin && isCatalogRoute && (
        <div ref={searchDockRef} className={clsx(styles.editorialSearchDock, !searchDockExpanded && styles.editorialSearchDockCollapsed)}>
          {searchDockExpanded ? (
            <StorefrontSearchBar
              hidePrices={Boolean(settings?.hidePrices)}
              placeholder="Buscar productos, categorías o marcas..."
            />
          ) : (
            <button
              type="button"
              className={styles.editorialSearchCollapsedButton}
              onClick={() => {
                const currentScrollY = window.scrollY;
                setSearchDockExpanded(true);
                window.requestAnimationFrame(() => {
                  const input = searchDockRef.current?.querySelector<HTMLInputElement>('input[type="search"]');
                  input?.focus({ preventScroll: true });
                  window.scrollTo({ top: currentScrollY, behavior: 'auto' });
                  window.requestAnimationFrame(() => {
                    window.scrollTo({ top: currentScrollY, behavior: 'auto' });
                  });
                });
              }}
              aria-label="Abrir búsqueda"
            >
              <Search size={17} aria-hidden />
              <span>Buscar productos</span>
            </button>
          )}
          <button
            type="button"
            className={styles.editorialSearchDockToggle}
            onClick={() => setSearchDockExpanded(value => !value)}
            aria-expanded={searchDockExpanded}
            aria-label={searchDockExpanded ? 'Comprimir búsqueda' : 'Expandir búsqueda'}
          >
            {searchDockExpanded ? <ChevronDown size={16} aria-hidden /> : <ChevronUp size={16} aria-hidden />}
          </button>
        </div>
      )}

      <main id="storefront-content" className={clsx(styles.main, styles.mainEditorial)}>
        {isLoading ? (
          <div className={styles.loadingCenter}>
            <Loader2 size={32} className="spin" color="var(--accent)" aria-label="Cargando" />
          </div>
        ) : (
          <Suspense fallback={<div className={styles.fallback}><Loader2 size={24} className="spin" /></div>}>
            <Outlet context={{ settings }} />
          </Suspense>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <p className={styles.footerEyebrow}>Tienda online</p>
              <h2 className={styles.footerTitle}>{storeName}</h2>
              <p className={styles.footerText}>Prendas para todos los días. Atención personalizada y envíos a todo el país.</p>
            </div>
            {(companyAddress || companyInfo?.legalName || companyInfo?.companyName) && (
              <div className={styles.footerBusiness} aria-label="Información del negocio">
                <h3><Building2 size={16} aria-hidden /> Datos del negocio</h3>
                {(companyInfo?.legalName || companyInfo?.companyName) && <p>{companyInfo.legalName || companyInfo.companyName}</p>}
                {companyAddress && <p><MapPin size={15} aria-hidden /> {companyAddress}{companyInfo?.country ? `, ${companyInfo.country}` : ''}</p>}
              </div>
            )}
            {(companyInfo?.phone || companyInfo?.email || companyInfo?.website) && (
              <div className={styles.footerContact} aria-label="Contacto">
                <h3>Contacto</h3>
                {companyInfo?.phone && <a href={`tel:${companyInfo.phone}`}><Phone size={15} aria-hidden /> {companyInfo.phone}</a>}
                {companyInfo?.email && <a href={`mailto:${companyInfo.email}`}><Mail size={15} aria-hidden /> {companyInfo.email}</a>}
                {companyInfo?.website && <a href={companyInfo.website.startsWith('http') ? companyInfo.website : `https://${companyInfo.website}`} target="_blank" rel="noreferrer"><Globe2 size={15} aria-hidden /> Sitio web</a>}
              </div>
            )}
          </div>
          <div className={styles.footerCopy}>
            © {new Date().getFullYear()} Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
}
