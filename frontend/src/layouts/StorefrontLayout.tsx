import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LogIn, ChevronDown, Loader2, UserCircle, Search } from 'lucide-react';
import { Suspense, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/store/cart.store';
import { useStorefrontAuthStore } from '@/store/storefrontAuth.store';
import { storePrefix } from '@/utils/storefrontDomain';
import { storefrontApi } from '@/api/storefront.api';
import { buildStorefrontThemeCss } from '@/utils/storefrontTheme';
import styles from './StorefrontLayout.module.css';

export default function StorefrontLayout() {
  const totalItems = useCartStore(s => s.totalItems());
  const prefix = storePrefix();
  const navigate = useNavigate();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['storefrontSettings', prefix],
    queryFn: () => storefrontApi.getSettings(),
  });

  const { customer, isAuthenticated, loadCurrentCustomer, logout } = useStorefrontAuthStore();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={shellRef} className={styles.shell}>
      <style>{buildStorefrontThemeCss(primaryColor)}</style>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to={`${prefix}/`} className={styles.logo}>
            <div className={styles.logoMark}>{storeName.charAt(0).toUpperCase()}</div>
            {showStoreName && <span className={styles.logoName}>{storeName}</span>}
          </Link>

          {!isMobile && (
            <div className={styles.searchWrap}>
              <form
                className={styles.searchForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = new FormData(e.currentTarget).get('q');
                  if (q) navigate(`${prefix}/?search=${encodeURIComponent(q.toString())}`);
                }}
              >
                <Search size={16} className={styles.searchIcon} aria-hidden />
                <input
                  name="q"
                  type="search"
                  placeholder="Buscar productos..."
                  className={styles.searchInput}
                  aria-label="Buscar productos"
                />
              </form>
            </div>
          )}

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

      <main className={styles.main}>
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
          <h2 className={styles.footerTitle}>{storeName}</h2>
          <p className={styles.footerText}>
            Tecnología al servicio del comercio. Compra segura y envío a todo el país.
          </p>
          <div className={styles.footerCopy}>
            © {new Date().getFullYear()} Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
