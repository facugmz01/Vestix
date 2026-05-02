import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, Search, Menu, User } from 'lucide-react';
import { Suspense } from 'react';

export default function StorefrontLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Navbar */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link to="/store" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
              <div style={{ background: '#3b82f6', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px' }}>
                E
              </div>
              <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>ERP<span style={{ color: '#3b82f6' }}>Store</span></span>
            </Link>
          </div>

          <div style={{ flex: 1, maxWidth: '500px', margin: '0 32px', position: 'relative', display: 'none' /* We can put a global search here if wanted */ }}>
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '999px', border: '1px solid #cbd5e1', background: '#f1f5f9', outline: 'none' }}
            />
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '11px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to="/store/my-orders" style={{ textDecoration: 'none', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600 }}>
              <User size={18} /> Mi Cuenta
            </Link>
            <Link to="/store/cart" style={{ textDecoration: 'none', position: 'relative', cursor: 'pointer', padding: '8px', background: '#f1f5f9', borderRadius: '50%', color: '#0f172a' }}>
              <ShoppingCart size={20} />
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px' }}>2</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Cargando catálogo...</div>}>
          <Outlet />
        </Suspense>
      </main>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '48px 24px', textAlign: 'center', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>ERP Storefront</h2>
          <p style={{ maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>La mejor tecnología impulsando el comercio minorista. Este es un módulo demostrativo del ERP.</p>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '24px', fontSize: '14px' }}>
            © {new Date().getFullYear()} Antigravity ERP. Todos los derechos reservados.
          </div>
        </div>
      </footer>

    </div>
  );
}
