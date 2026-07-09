import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { Search, PackageX, ChevronDown, Filter, ShoppingBag } from 'lucide-react';
import clsx from 'clsx';
import { storefrontApi, StorefrontSettings } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';
import { storePrefix } from '@/utils/storefrontDomain';
import { apiClient } from '@/api/client';
import { StorefrontSEO } from '@/features/storefront/components/StorefrontSEO';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from './OnlineCatalogPage.module.css';

export default function OnlineCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
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
      if (window.innerWidth >= 768) setShowFiltersMobile(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== searchInput) {
      setSearchInput(q);
      setSearch(q);
    }
  }, [searchParams, searchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      if (searchInput) {
        setSearchParams({ search: searchInput }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, setSearchParams]);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.storefront.products({ search, categoryId, brand: brandId, sortBy }),
    queryFn: () => storefrontApi.getProducts({ search, categoryId, brand: brandId, sortBy }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['storefront', 'categories'],
    queryFn: () => apiClient.get('/catalog/categories/public').then(r => r.data ?? r),
  });

  const { data: brandsData } = useQuery({
    queryKey: ['storefront', 'brands'],
    queryFn: () => apiClient.get('/catalog/brands/public').then(r => r.data ?? r),
  });

  const products = data?.data || [];
  const categories: { id: string; name: string }[] = categoriesData || [];
  const brands: { id: string; name: string }[] = brandsData || [];

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategoryId('');
    setBrandId('');
    setShowFiltersMobile(false);
  };

  const activeFiltersCount = (categoryId ? 1 : 0) + (brandId ? 1 : 0) + (search ? 1 : 0);

  const renderFilterButton = (
    label: string,
    active: boolean,
    onClick: () => void,
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={clsx(styles.filterBtn, active && styles.filterBtnActive)}
    >
      {label}
    </button>
  );

  const filtersContent = (
    <div className={styles.filters}>
      <div>
        <h4 className={styles.filterSectionTitle}>Buscar</h4>
        <div className={styles.searchWrap}>
          <input
            type="search"
            className={clsx('storefront-input', styles.searchInput)}
            placeholder="Ej: Remera, Zapatillas..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            aria-label="Buscar productos"
          />
          <Search size={16} className={styles.searchIcon} aria-hidden />
        </div>
      </div>

      <hr className={styles.divider} />

      <div>
        <h4 className={styles.filterSectionTitle}>Categorías</h4>
        <div className={styles.filterList}>
          {renderFilterButton('Todas las Categorías', categoryId === '', () => {
            setCategoryId('');
            if (isMobile) setShowFiltersMobile(false);
          })}
          {categories.map(c => renderFilterButton(c.name, categoryId === c.id, () => {
            setCategoryId(c.id);
            if (isMobile) setShowFiltersMobile(false);
          }))}
        </div>
      </div>

      {brands.length > 0 && (
        <>
          <hr className={styles.divider} />
          <div>
            <h4 className={styles.filterSectionTitle}>Marcas</h4>
            <div className={styles.filterList}>
              {renderFilterButton('Todas las Marcas', brandId === '', () => {
                setBrandId('');
                if (isMobile) setShowFiltersMobile(false);
              })}
              {brands.map(b => renderFilterButton(b.name, brandId === b.id, () => {
                setBrandId(b.id);
                if (isMobile) setShowFiltersMobile(false);
              }))}
            </div>
          </div>
        </>
      )}

      {activeFiltersCount > 0 && (
        <button type="button" onClick={clearFilters} className={styles.clearBtn}>
          Limpiar Filtros
        </button>
      )}
    </div>
  );

  return (
    <main className={styles.main}>
      <StorefrontSEO title="Catálogo | Tienda Oficial" />

      <div className={styles.hero}>
        <span className={styles.heroBadge}>Nuevos Ingresos</span>
        <h1 className={styles.heroTitle}>Nueva Colección</h1>
        <p className={styles.heroText}>
          Descubrí nuestros últimos productos y encontrá tu estilo perfecto comprando directo desde nuestra tienda oficial.
        </p>
      </div>

      <div className={clsx(styles.layout, isMobile && styles.layoutMobile)}>
        {!isMobile && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarTitle}>
              <Filter size={18} color="var(--text-primary)" />
              <h3>Filtros</h3>
            </div>
            {filtersContent}
          </aside>
        )}

        {isMobile && showFiltersMobile && (
          <div className={styles.drawerOverlay} onClick={() => setShowFiltersMobile(false)} role="presentation">
            <div className={styles.drawer} onClick={e => e.stopPropagation()} role="dialog" aria-label="Filtros">
              <div className={styles.drawerHeader}>
                <h3 className={styles.drawerTitle}><Filter size={18} /> Filtros</h3>
                <button type="button" onClick={() => setShowFiltersMobile(false)} className={styles.drawerClose} aria-label="Cerrar filtros">✕</button>
              </div>
              {filtersContent}
            </div>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.controlsBar}>
            <div>
              {!isLoading && (
                <p className={styles.resultCount}>
                  Mostrando <strong>{products.length}</strong> productos
                </p>
              )}
            </div>

            <div className={styles.controlsRight}>
              {isMobile && (
                <button type="button" onClick={() => setShowFiltersMobile(true)} className={styles.mobileFilterBtn}>
                  <Filter size={16} /> Filtrar
                  {activeFiltersCount > 0 && (
                    <span className={styles.filterCount}>{activeFiltersCount}</span>
                  )}
                </button>
              )}

              <div className={styles.sortWrap}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className={styles.sortSelect}
                  aria-label="Ordenar productos"
                >
                  <option value="NEWEST">Más Recientes</option>
                  <option value="PRICE_ASC">Menor Precio</option>
                  <option value="PRICE_DESC">Mayor Precio</option>
                </select>
                <ChevronDown size={14} className={styles.sortIcon} aria-hidden />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className={styles.skeletonGrid}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className={styles.skeletonCard} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className={styles.empty}>
              <PackageX size={64} color="var(--text-muted)" style={{ margin: '0 auto 24px', display: 'block', opacity: 0.5 }} />
              <h3 className={styles.emptyTitle}>No encontramos productos</h3>
              <p className={styles.emptyText}>
                {search
                  ? `No hay resultados que coincidan con "${search}".`
                  : 'No hay productos publicados que coincidan con los filtros seleccionados.'}
              </p>
              {activeFiltersCount > 0 && (
                <button type="button" onClick={clearFilters} className="storefront-btn">
                  Limpiar Búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map(p => {
                const isAvailable = p.inStock;
                const hasImage = p.images && p.images.length > 0;
                const price = p.price || p.basePrice || 0;

                return (
                  <Link key={p.id} to={`${prefix}/product/${p.id}`} className={styles.productCard}>
                    <div className={styles.imageArea}>
                      {hasImage ? (
                        <img src={p.images![0]} alt={p.name} className={styles.productImage} loading="lazy" />
                      ) : (
                        <div className={styles.placeholder}>
                          <ShoppingBag size={48} color="var(--text-primary)" style={{ marginBottom: 12 }} />
                          <span className={styles.placeholderLetter}>{p.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}

                      <div className={styles.badges}>
                        {!isAvailable && <span className={styles.soldOut}>Agotado</span>}
                      </div>

                      {!isMobile && <div className={styles.quickAdd}>Ver Detalles</div>}
                    </div>

                    <div className={styles.productBody}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                        {p.brand || p.category || 'Categoría'}
                      </span>
                      <h3 className={styles.productName}>{p.name}</h3>
                      <p className={styles.productPrice}>
                        {p.maxPrice && p.maxPrice > price
                          ? `Desde ${formatCurrency(price)}`
                          : formatCurrency(price)}
                      </p>
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
