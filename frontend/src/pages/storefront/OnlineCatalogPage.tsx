import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useOutletContext } from 'react-router-dom';
import { Search, SlidersHorizontal, PackageX, ChevronDown, Filter, ShoppingBag } from 'lucide-react';
import { storefrontApi, StorefrontSettings } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';
import { storePrefix } from '@/utils/storefrontDomain';
import { apiClient } from '@/api/client';
import { StorefrontSEO } from '@/features/storefront/components/StorefrontSEO';
import { formatCurrency } from '@/utils/formatCurrency';

export default function OnlineCatalogPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
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
    queryKey: queryKeys.storefront.products({ search, categoryId, brand: brandId, sortBy }),
    queryFn: () => storefrontApi.getProducts({ search, categoryId, brand: brandId, sortBy }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => apiClient.get('/categories').then(r => r.data),
  });

  const { data: brandsData } = useQuery({
    queryKey: queryKeys.brands.all(),
    queryFn: () => apiClient.get('/brands').then(r => r.data),
  });

  const products = data?.data || [];
  const categories: { id: string; name: string }[] = categoriesData || [];
  const brands: { id: string; name: string }[] = brandsData || [];


  const sorted = products;

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setBrandId('');
    setShowFiltersMobile(false);
  };

  const activeFiltersCount = (categoryId ? 1 : 0) + (brandId ? 1 : 0) + (search ? 1 : 0);

  const filtersContent = (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      
      {/* Search Input */}
      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Buscar
        </h4>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="storefront-input"
            placeholder="Ej: Remera, Zapatillas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              paddingLeft: '38px', 
              borderRadius: '8px', 
              background: 'var(--bg-overlay)', 
              border: '1px solid var(--border)',
              height: '42px',
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
        </div>
      </div>

      <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />

      {/* Categories */}
      <div>
        <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Categorías
        </h4>
        <div className="flex-col gap-2" style={{ display: 'flex', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
          <button 
            onClick={() => { setCategoryId(''); if(isMobile) setShowFiltersMobile(false); }}
            style={{
              textAlign: 'left', background: 'none', border: 'none', padding: '6px 8px', borderRadius: '6px',
              fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
              color: categoryId === '' ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: categoryId === '' ? 600 : 400,
              backgroundColor: categoryId === '' ? 'rgba(99,102,241,0.1)' : 'transparent'
            }}
          >
            Todas las Categorías
          </button>
          {categories.map(c => (
            <button 
              key={c.id}
              onClick={() => { setCategoryId(c.id); if(isMobile) setShowFiltersMobile(false); }}
              style={{
                textAlign: 'left', background: 'none', border: 'none', padding: '6px 8px', borderRadius: '6px',
                fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                color: categoryId === c.id ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: categoryId === c.id ? 600 : 400,
                backgroundColor: categoryId === c.id ? 'rgba(99,102,241,0.1)' : 'transparent'
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Marcas
          </h4>
          <div className="flex-col gap-2" style={{ display: 'flex', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
            <button 
              onClick={() => { setBrandId(''); if(isMobile) setShowFiltersMobile(false); }}
              style={{
                textAlign: 'left', background: 'none', border: 'none', padding: '6px 8px', borderRadius: '6px',
                fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                color: brandId === '' ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: brandId === '' ? 600 : 400,
                backgroundColor: brandId === '' ? 'rgba(99,102,241,0.1)' : 'transparent'
              }}
            >
              Todas las Marcas
            </button>
            {brands.map(b => (
              <button 
                key={b.id}
                onClick={() => { setBrandId(b.id); if(isMobile) setShowFiltersMobile(false); }}
                style={{
                  textAlign: 'left', background: 'none', border: 'none', padding: '6px 8px', borderRadius: '6px',
                  fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                  color: brandId === b.id ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: brandId === b.id ? 600 : 400,
                  backgroundColor: brandId === b.id ? 'rgba(99,102,241,0.1)' : 'transparent'
                }}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeFiltersCount > 0 && (
        <button 
          onClick={clearFilters}
          style={{
            marginTop: '8px', padding: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600, transition: 'all 0.2s', textAlign: 'center'
          }}
        >
          Limpiar Filtros
        </button>
      )}
    </div>
  );

  return (
    <main style={{ minHeight: '100%', padding: isMobile ? '16px' : '32px', background: 'var(--bg-base)', fontFamily: "'Inter', sans-serif" }}>
      <StorefrontSEO title="Catálogo | Tienda Oficial" />
      
      {/* Top Banner / Hero Premium */}
      <div style={{
        maxWidth: '1280px', margin: '0 auto 40px', padding: isMobile ? '40px 24px' : '80px 48px',
        background: 'linear-gradient(135deg, rgba(var(--sf-primary-rgb), 0.05) 0%, rgba(var(--sf-primary-rgb), 0.12) 100%)',
        borderRadius: '32px', border: '1px solid rgba(var(--sf-primary-rgb), 0.1)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
        boxShadow: '0 24px 48px -12px rgba(var(--sf-primary-rgb), 0.15)'
      }}>
        {/* Glow orb inside hero */}
        <div style={{ position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(var(--sf-primary-rgb),0.15) 0%, rgba(var(--sf-primary-rgb),0) 70%)', filter: 'blur(40px)', zIndex: 0, pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '99px', background: 'rgba(var(--sf-primary-rgb), 0.15)', color: 'var(--sf-primary)', fontWeight: 800, fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '24px' }}>
            Nuevos Ingresos
          </span>
          <h1 style={{ margin: '0 0 16px', fontSize: isMobile ? '36px' : '56px', fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
            Nueva Colección
          </h1>
          <p style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', color: '#475569', maxWidth: '540px', marginInline: 'auto', lineHeight: 1.6 }}>
            Descubrí nuestros últimos productos y encontrá tu estilo perfecto comprando directo desde nuestra tienda oficial.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
        
        {/* Sidebar Filters - Desktop only */}
        {!isMobile && (
          <aside style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Filter size={18} color="var(--text-primary)" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Filtros
              </h3>
            </div>
            {filtersContent}
          </aside>
        )}

        {/* Floating Filter Drawer - Mobile only */}
        {isMobile && showFiltersMobile && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0, 0.7)', zIndex: 1000, display: 'flex', justifyContent: 'flex-start', backdropFilter: 'blur(4px)' }} onClick={() => setShowFiltersMobile(false)}>
            <div style={{ width: '85%', maxWidth: '320px', height: '100%', background: 'var(--bg-elevated)', padding: '24px', boxSizing: 'border-box', overflowY: 'auto', boxShadow: '4px 0 24px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 700 }}>
                  <Filter size={18} /> Filtros
                </h3>
                <button onClick={() => setShowFiltersMobile(false)} style={{ background: 'var(--bg-overlay)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
              </div>
              {filtersContent}
            </div>
          </div>
        )}

        {/* Product Grid Container */}
        <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
          
          {/* Controls Bar */}
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            marginBottom: '32px', flexWrap: 'wrap', gap: '16px',
            background: 'var(--bg-overlay)', padding: '12px 20px', borderRadius: '12px', border: '1px solid var(--border)'
          }}>
            <div>
              {!isLoading && (
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Mostrando <strong style={{ color: 'var(--text-primary)' }}>{sorted.length}</strong> productos
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
              {isMobile && (
                <button
                  onClick={() => setShowFiltersMobile(true)}
                  style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}
                >
                  <Filter size={16} /> Filtrar
                  {activeFiltersCount > 0 && (
                    <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>{activeFiltersCount}</span>
                  )}
                </button>
              )}

              <div style={{ position: 'relative', flex: isMobile ? 1 : 'none' }}>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  style={{ 
                    appearance: 'none', width: '100%',
                    padding: '10px 36px 10px 16px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="NEWEST">Más Recientes</option>
                  <option value="PRICE_ASC">Menor Precio</option>
                  <option value="PRICE_DESC">Mayor Precio</option>
                </select>
                <ChevronDown size={14} color="var(--text-muted)" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} style={{ background: 'var(--bg-overlay)', borderRadius: '16px', height: '360px', animation: 'pulse 2s infinite ease-in-out' }} />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-overlay)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
              <PackageX size={64} color="var(--text-muted)" style={{ margin: '0 auto 24px', display: 'block', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>No encontramos productos</h3>
              <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '400px', marginInline: 'auto' }}>
                {search ? `No hay resultados que coincidan con "${search}".` : 'No hay productos publicados que coincidan con los filtros seleccionados.'}
              </p>
              {activeFiltersCount > 0 && (
                <button 
                  onClick={clearFilters}
                  style={{ padding: '12px 24px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Limpiar Búsqueda
                </button>
              )}
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
              gap: isMobile ? '16px' : '24px' 
            }}>
              {sorted.map(p => {
                const isAvailable = p.inStock;
                const hasImage = p.images && p.images.length > 0;
                
                return (
                  <Link
                    key={p.id}
                    to={`${prefix}/product/${p.id}`}
                    style={{ 
                      textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', 
                      background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', 
                      border: '1px solid #F1F5F9', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
                      cursor: 'pointer', position: 'relative',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                    }}
                    onMouseEnter={e => { 
                      e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)'; 
                      e.currentTarget.style.boxShadow = '0 24px 48px -12px rgba(var(--sf-primary-rgb),0.15), 0 0 0 1px rgba(var(--sf-primary-rgb),0.1)'; 
                      const btn = e.currentTarget.querySelector('.quick-add-btn') as HTMLElement;
                      if(btn) { btn.style.opacity = '1'; btn.style.transform = 'translateY(0)'; }
                    }}
                    onMouseLeave={e => { 
                      e.currentTarget.style.transform = 'translateY(0) scale(1)'; 
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)'; 
                      const btn = e.currentTarget.querySelector('.quick-add-btn') as HTMLElement;
                      if(btn) { btn.style.opacity = '0'; btn.style.transform = 'translateY(10px)'; }
                    }}
                  >
                    {/* Image Area */}
                    <div style={{ 
                      height: isMobile ? '240px' : '320px', 
                      background: hasImage ? '#fff' : (p.id.charCodeAt(0) % 2 === 0 ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'), 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                      overflow: 'hidden', borderBottom: '1px solid #F1F5F9'
                    }}>
                      {hasImage ? (
                        <img 
                          src={p.images![0]} 
                          alt={p.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      ) : (
                        // Fallback image / placeholder
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.4 }}>
                          <ShoppingBag size={48} color="var(--text-primary)" style={{ marginBottom: '12px' }} />
                          <span style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 900, userSelect: 'none' }}>
                            {p.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Badges */}
                      <div style={{
                        position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px'
                      }}>
                        {!isAvailable && (
                          <span style={{
                            background: 'var(--red)', color: '#fff', fontSize: '10px', fontWeight: 800,
                            padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.5px', textTransform: 'uppercase',
                            boxShadow: '0 2px 8px rgba(239,68,68,0.4)'
                          }}>
                            Agotado
                          </span>
                        )}
                        {/* Example Discount Badge if applies */}
                        {/* <span style={{ background: 'var(--accent)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>-20% OFF</span> */}
                      </div>

                      {/* Quick Add Button (Hover) */}
                      {!isMobile && (
                        <div 
                          className="quick-add-btn"
                          style={{ 
                            position: 'absolute', bottom: '16px', left: '16px', right: '16px',
                            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)',
                            color: '#000', fontWeight: 700, fontSize: '13px', padding: '12px',
                            borderRadius: '8px', textAlign: 'center', opacity: 0, transform: 'translateY(10px)',
                            transition: 'all 0.2s ease', border: '1px solid rgba(0,0,0,0.1)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                          }}
                        >
                          Ver Detalles
                        </div>
                      )}
                    </div>

                    {/* Info Area */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        {p.brand || p.category || 'Categoría'}
                      </span>
                      
                      <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, lineHeight: 1.4, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {p.name}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {formatCurrency(p.price || p.basePrice || 0)}
                        </span>
                        
                        {isMobile && (
                          <div style={{ 
                            background: 'var(--bg-overlay)', padding: '6px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            <ShoppingBag size={14} color="var(--text-primary)" />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
