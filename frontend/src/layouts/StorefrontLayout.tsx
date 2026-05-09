import { Outlet, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User } from 'lucide-react';
import { Suspense } from 'react';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';

export default function StorefrontLayout() {
  const totalItems = useCartStore(s => s.totalItems());
  const prefix = storePrefix();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Navbar */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo */}
          <Link to={`${prefix}/`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
            <div style={{ background: '#3b82f6', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px' }}>
              E
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>ERP<span style={{ color: '#3b82f6' }}>Store</span></span>
          </Link>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to={`${prefix}/my-orders`} style={{ textDecoration: 'none', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600 }}>
              <User size={18} /> Mi Cuenta
            </Link>
            <Link to={`${prefix}/cart`} style={{ textDecoration: 'none', position: 'relative', cursor: 'pointer', padding: '8px', background: '#f1f5f9', borderRadius: '50%', color: '#0f172a' }}>
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px' }}>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>}>
          <Outlet />
        </Suspense>
      </main>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '48px 24px', textAlign: 'center', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>ERPStore</h2>
          <p style={{ maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>Tecnología al servicio del comercio. Compra segura y envío a todo el país.</p>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '24px', fontSize: '14px' }}>
            © {new Date().getFullYear()} Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
}
