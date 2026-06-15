import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useOutletContext } from 'react-router-dom';
import { Search, SlidersHorizontal, PackageX, Tag } from 'lucide-react';
import { storefrontApi, StorefrontSettings } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';
import { storePrefix } from '@/utils/storefrontDomain';
import { apiClient } from '@/api/client';
import { APP_CONFIG } from '@/config/app.config';

export default function OnlineCatalogPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sortBy, setSortBy] = useState<'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST'>('NEWEST');
  const prefix = storePrefix();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const { settings } = useOutletContext<{ settings?: StorefrontSettings }>();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowFiltersMobile(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.storefront.products({ search, categoryId, sortBy }),
    queryFn: () => storefrontApi.getProducts({ search, categoryId, sortBy }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => apiClient.get('/categories').then(r => r.data),
  });

  const products = data?.data || [];
  const categories: { id: string; name: string }[] = categoriesData || [];

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'PRICE_ASC') return a.basePrice - b.basePrice;
    if (sortBy === 'PRICE_DESC') return b.basePrice - a.basePrice;
    return 0;
  });

  // const title = settings?.pwa?.appName || APP_CONFIG.appName;

  const filtersContent = (
    <div className="flex-col gap-4" style={{ display: 'flex' }}>
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Buscar</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="storefront-input"
            placeholder="Remera, zapatillas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '34px' }}
          />
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categoría</label>
        <div className="flex-col gap-2" style={{ display: 'flex' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', color: categoryId === '' ? 'var(--accent)' : 'var(--text-primary)', fontWeight: categoryId === '' ? 700 : 400 }}>
            <input type="radio" name="cat" checked={categoryId === ''} onChange={() => { setCategoryId(''); setShowFiltersMobile(false); }} style={{ accentColor: 'var(--accent)' }} />
            Todas
          </label>
          {categories.map(c => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', color: categoryId === c.id ? 'var(--accent)' : 'var(--text-primary)', fontWeight: categoryId === c.id ? 700 : 400 }}>
              <input type="radio" name="cat" checked={categoryId === c.id} onChange={() => { setCategoryId(c.id); setShowFiltersMobile(false); }} style={{ accentColor: 'var(--accent)' }} />
              {c.name}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: '60px' }}>
      
      {/* Main Content */}      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '32px', alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
        
        {/* Sidebar Filters - Desktop only */}
        {!isMobile && (
          <aside style={{ width: '240px', flexShrink: 0, position: 'sticky', top: '84px' }}>
            <div className="glass" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}>
                <SlidersHorizontal size={16} /> Filtros
              </h3>
              {filtersContent}
            </div>
          </aside>
        )}

        {/* Floating Filter Drawer - Mobile only */}
        {isMobile && showFiltersMobile && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0, 0.6)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setShowFiltersMobile(false)}>
            <div style={{ width: '280px', height: '100%', background: 'var(--bg-surface)', padding: '24px', boxSizing: 'border-box', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
                  <SlidersHorizontal size={18} /> Filtros
                </h3>
                <button onClick={() => setShowFiltersMobile(false)} style={{ background: 'none', border: 'none', fontSize: '18px', fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
              </div>
              {filtersContent}
            </div>
          </div>
        )}

        {/* Product Grid Container */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)' }}>Catálogo</h2>
              {!isLoading && <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{sorted.length} productos encontrados</p>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isMobile && (
                <button
                  onClick={() => setShowFiltersMobile(true)}
                  className="storefront-btn storefront-btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  <SlidersHorizontal size={14} /> Filtros
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} color="var(--text-muted)" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="storefront-input"
                  style={{ padding: '8px 14px', width: 'auto' }}
                >
                  <option value="NEWEST">Más Recientes</option>
                  <option value="PRICE_ASC">Menor Precio</option>
                  <option value="PRICE_DESC">Mayor Precio</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="storefront-grid">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ background: 'var(--bg-overlay)', borderRadius: '16px', height: isMobile ? '240px' : '340px' }} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: '64px' }}>
              <PackageX size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: 'var(--text-primary)' }}>Sin resultados</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                {search ? `No encontramos "${search}". Probá con otro término.` : 'No hay productos publicados en este momento.'}
              </p>
            </div>
          ) : (
            <div className="storefront-grid">
              {sorted.map(p => {
                const isAvailable = p.inStock;
                return (
                  <Link
                    key={p.id}
                    to={`${prefix}/product/${p.id}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)', transition: 'box-shadow 0.2s ease, transform 0.2s ease', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-glow)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* Image placeholder */}
                    <div style={{ height: isMobile ? '150px' : '230px', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <span style={{ fontSize: isMobile ? '44px' : '64px', color: 'var(--text-muted)', fontWeight: 900, userSelect: 'none' }}>
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                      <div style={{
                        position: 'absolute', top: '10px', left: '10px',
                        background: isAvailable ? 'var(--green)' : 'var(--red)',
                        color: '#fff', fontSize: '9px', fontWeight: 800,
                        padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.5px'
                      }}>
                        {isAvailable ? 'DISPONIBLE' : 'SIN STOCK'}
                      </div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: isMobile ? '12px' : '16px 20px 20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        {p.brand || p.category || 'Sin Categoría'}
                      </span>
                      <h3 style={{ margin: '0 0 10px', fontSize: isMobile ? '13px' : '15px', fontWeight: 700, lineHeight: 1.3, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {p.name}
                      </h3>

                      {/* Variant chips */}
                      {p.variants && p.variants.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          {p.variants.slice(0, 3).map((v: any) => (
                            <span key={v.id} style={{ padding: '2px 5px', background: 'var(--bg-overlay)', borderRadius: '4px', fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {v.size ? `T.${v.size}` : (v.color || v.sku.slice(0,5))}
                            </span>
                          ))}
                          {p.variants.length > 3 && (
                            <span style={{ padding: '2px 5px', background: 'var(--bg-overlay)', borderRadius: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
                              +{p.variants.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <span style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: 900, color: 'var(--text-primary)' }}>
                        {fmtCurrency(p.basePrice || p.price || 0)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
