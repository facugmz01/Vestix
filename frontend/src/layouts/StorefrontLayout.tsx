import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, LogIn, ChevronDown, Loader2 } from 'lucide-react';
import { Suspense, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/store/cart.store';
import { useStorefrontAuthStore } from '@/store/storefrontAuth.store';
import { storePrefix } from '@/utils/storefrontDomain';
import { storefrontApi } from '@/api/storefront.api';

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

  // Validate storefront session on mount
  useEffect(() => {
    loadCurrentCustomer();
  }, [loadCurrentCustomer]);

  // Responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close user menu on outside click
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

  // Truncate display name
  const displayName = customer?.fullName
    ? customer.fullName.length > 14
      ? customer.fullName.slice(0, 14) + '…'
      : customer.fullName
    : customer?.phone || 'Mi Cuenta';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: '"Inter", sans-serif' }}>

      {/* Navbar */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '12px 16px' : '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <Link to={`${prefix}/`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <div style={{ background: '#3b82f6', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px' }}>
              E
            </div>
            <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>ERP<span style={{ color: '#3b82f6' }}>Store</span></span>
          </Link>

          {/* Nav controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>

            {/* Auth Area */}
            {isAuthenticated && customer ? (
              // Authenticated: User dropdown
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: '#f1f5f9', border: 'none', borderRadius: '10px',
                    padding: isMobile ? '7px 10px' : '7px 14px',
                    cursor: 'pointer', color: '#0f172a', fontSize: '13px', fontWeight: 600,
                    transition: 'background 0.2s',
                  }}
                  aria-label="Menú de usuario"
                >
                  <User size={16} />
                  {!isMobile && <span>{displayName}</span>}
                  <ChevronDown size={14} style={{ opacity: 0.5, transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: '180px',
                    overflow: 'hidden', zIndex: 200,
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>Hola,</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{customer.fullName}</div>
                      {customer.phone && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>+{customer.phone}</div>
                      )}
                    </div>
                    <Link
                      to={`${prefix}/my-orders`}
                      onClick={() => setUserMenuOpen(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: '#0f172a', fontSize: '14px', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <User size={15} /> Mis pedidos
                    </Link>
                    <button
                      onClick={handleLogout}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: 'none', background: 'transparent', color: '#ef4444', fontSize: '14px', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={15} /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Not authenticated: Login link
              <Link
                to={`${prefix}/login`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#f1f5f9', borderRadius: '10px',
                  padding: isMobile ? '7px 10px' : '7px 14px',
                  textDecoration: 'none', color: '#0f172a', fontSize: '13px', fontWeight: 600,
                  transition: 'background 0.2s',
                }}
                title="Iniciar sesión"
              >
                <LogIn size={16} />
                {!isMobile && <span>Ingresar</span>}
              </Link>
            )}

            {/* Cart */}
            <Link
              to={`${prefix}/cart`}
              style={{ textDecoration: 'none', position: 'relative', cursor: 'pointer', padding: '8px', background: '#f1f5f9', borderRadius: '50%', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Carrito de Compras"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center' }}>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
            <Loader2 size={32} className="spin" color="var(--accent)" />
          </div>
        ) : (
          <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}><Loader2 size={24} className="spin" /></div>}>
            <Outlet context={{ settings }} />
          </Suspense>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: isMobile ? '32px 16px' : '48px 24px', textAlign: 'center', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>ERPStore</h2>
          <p style={{ maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6, fontSize: '14px' }}>Tecnología al servicio del comercio. Compra segura y envío a todo el país.</p>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '24px', fontSize: '13px' }}>
            © {new Date().getFullYear()} Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
}
