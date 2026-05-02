import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, PackageX } from 'lucide-react';
import { storefrontApi } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';

export default function OnlineCatalogPage() {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [sortBy, setSortBy] = useState<'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST'>('NEWEST');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.storefront.products({ search, categoryId, brand, sortBy }),
    queryFn: () => storefrontApi.getProducts({ search, categoryId, brand, sortBy }),
  });

  const products = data?.data || [];

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  // Mock categories & brands for UI purposes
  const categories = [
    { id: '1', name: 'Indumentaria' },
    { id: '2', name: 'Calzado' },
    { id: '3', name: 'Accesorios' }
  ];
  const brands = ['Nike', 'Adidas', 'Puma', 'Vans', 'Genérico'];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      
      {/* Sidebar Filters */}
      <aside style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '100px' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700 }}>
            <SlidersHorizontal size={18} /> Filtros
          </h3>

          {/* Search Box */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#475569' }}>Buscar</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Ej: Zapatillas..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#475569' }}>Categoría</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="radio" name="cat" checked={categoryId === ''} onChange={() => setCategoryId('')} />
                Todas las categorías
              </label>
              {categories.map(c => (
                <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <input type="radio" name="cat" checked={categoryId === c.id} onChange={() => setCategoryId(c.id)} />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#475569' }}>Marca</label>
            <select 
              value={brand} 
              onChange={e => setBrand(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', outline: 'none' }}
            >
              <option value="">Todas las marcas</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

        </div>
      </aside>

      {/* Product Grid Area */}
      <div style={{ flex: 1 }}>
        
        {/* Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>Catálogo</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', color: '#64748b' }}>Ordenar por:</span>
            <select 
              value={sortBy} 
              onChange={(e: any) => setSortBy(e.target.value)}
              style={{ padding: '8px 16px', borderRadius: '999px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff', outline: 'none', fontWeight: 600 }}
            >
              <option value="NEWEST">Más Recientes</option>
              <option value="PRICE_ASC">Menor Precio</option>
              <option value="PRICE_DESC">Mayor Precio</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: '#e2e8f0', borderRadius: '12px', height: '350px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <PackageX size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>No hay resultados</h3>
            <p style={{ margin: 0, color: '#64748b' }}>Intenta ajustar los filtros de búsqueda.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
            {products.map(p => {
              // Assume totalStock > 0 means available
              const isAvailable = true; // Replace with actual logic `p.variants.some(v => v.stock > 0)`

              return (
                <Link key={p.id} to={`/store/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  
                  {/* Image Placeholder */}
                  <div style={{ height: '250px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>{p.name.charAt(0)}</span>
                    {!isAvailable && (
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px' }}>SIN STOCK</div>
                    )}
                    {isAvailable && (
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: '#22c55e', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 8px', borderRadius: '4px' }}>DISPONIBLE</div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{p.brand || 'Sin Marca'}</span>
                    <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 700, lineHeight: 1.3, color: '#0f172a' }}>{p.name}</h3>
                    
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a' }}>{fmtCurrency(p.basePrice)}</span>
                      {p.taxRate > 0 && <span style={{ fontSize: '12px', color: '#94a3b8' }}>+IVA</span>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
