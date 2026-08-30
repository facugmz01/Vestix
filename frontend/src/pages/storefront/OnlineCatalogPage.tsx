import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { Search, PackageX, ChevronDown, Filter, ShoppingBag, ChevronLeft, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';
import { storefrontApi, StorefrontSettings } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';
import { storePrefix } from '@/utils/storefrontDomain';
import { apiClient } from '@/api/client';
import { StorefrontSEO } from '@/features/storefront/components/StorefrontSEO';
import { formatCurrency } from '@/utils/formatCurrency';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './OnlineCatalogPage.module.css';

interface Banner {
  url: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, banners.length]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  const goToIndex = (index: number) => setCurrentIndex(index);

  if (!banners || banners.length === 0) return null;

  return (
    <div 
      className={styles.carousel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {banners.map((banner, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={index}
            className={clsx(styles.carouselSlide, isActive ? styles.carouselSlideActive : styles.carouselSlideInactive)}
            style={{ backgroundImage: `url(${banner.url})` }}
          >
            <div className={styles.carouselOverlay}></div>
            <div className={styles.carouselContent}>
              {banner.title && <h2 className={styles.carouselTitle}>{banner.title}</h2>}
              {banner.subtitle && <p className={styles.carouselSubtitle}>{banner.subtitle}</p>}
              {banner.ctaText && banner.ctaLink && (
                <Link to={banner.ctaLink} className={styles.carouselCta}>
                  {banner.ctaText}
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {banners.length > 1 && (
        <>
          <button type="button" onClick={handlePrev} className={clsx(styles.carouselArrow, styles.carouselArrowLeft)} aria-label="Anterior">
            <ChevronLeft size={24} />
          </button>
          <button type="button" onClick={handleNext} className={clsx(styles.carouselArrow, styles.carouselArrowRight)} aria-label="Siguiente">
            <ChevronRight size={24} />
          </button>

          <div className={styles.carouselDots}>
            {banners.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToIndex(index)}
                className={clsx(styles.carouselDot, index === currentIndex && styles.carouselDotActive)}
                aria-label={`Ir a la diapositiva ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OnlineCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearchTerm = searchParams.get('search') || searchParams.get('q') || '';
  
  const [searchInput, setSearchInput] = useState(urlSearchTerm);
  const debouncedSearch = useDebounce<string>(searchInput.trim(), 350);

  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [sortBy, setSortBy] = useState<'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST'>('NEWEST');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
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

  // Sync state if URL changes externally
  useEffect(() => {
    if (urlSearchTerm !== searchInput) {
      setSearchInput(urlSearchTerm);
    }
  }, [urlSearchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL search parameters without destroying existing params (preserving category, brand, etc.)
  useEffect(() => {
    const currentParam = searchParams.get('search') || searchParams.get('q') || '';
    if (debouncedSearch !== currentParam) {
      const nextParams = new URLSearchParams(searchParams);
      if (debouncedSearch) {
        nextParams.set('search', debouncedSearch);
        nextParams.delete('q');
      } else {
        nextParams.delete('search');
        nextParams.delete('q');
      }
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch, searchParams, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId, brandId, sortBy, pageSize]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.storefront.products({
      search: debouncedSearch,
      categoryId,
      brand: brandId,
      sortBy,
      page,
      pageSize,
    }),
    queryFn: ({ signal }) =>
      storefrontApi.getProducts(
        { search: debouncedSearch, categoryId, brand: brandId, sortBy, page, pageSize },
        { signal }
      ),
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
  const totalProducts = data?.metadata?.total ?? products.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const categories: { id: string; name: string }[] = categoriesData || [];
  const brands: { id: string; name: string }[] = brandsData || [];

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const clearFilters = () => {
    setSearchInput('');
    setCategoryId('');
    setBrandId('');
    setPage(1);
    setShowFiltersMobile(false);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('search');
    nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
  };

  const activeFiltersCount = (categoryId ? 1 : 0) + (brandId ? 1 : 0) + (debouncedSearch ? 1 : 0);

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
            placeholder="Ej: Remera, Zapatillas, SKU..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            aria-label="Buscar productos"
          />
          <Search size={16} className={styles.searchIcon} aria-hidden />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
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

  const hasBanners = settings?.imagesCarousel && settings.imagesCarousel.length > 0;

  return (
    <main className={styles.main}>
      <StorefrontSEO title="Catálogo | Tienda Oficial" />

      {hasBanners ? (
        <BannerCarousel banners={settings.imagesCarousel as any} />
      ) : (
        <div className={styles.hero}>
          <span className={styles.heroBadge}>Nuevos Ingresos</span>
          <h1 className={styles.heroTitle}>Nueva Colección</h1>
          <p className={styles.heroText}>
            Descubrí nuestros últimos productos y encontrá tu estilo perfecto comprando directo desde nuestra tienda oficial.
          </p>
        </div>
      )}

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
                  Mostrando{' '}
                  <strong>
                    {totalProducts > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, totalProducts)}
                  </strong>{' '}
                  de <strong>{totalProducts}</strong> productos
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

              <div className={styles.pageSizeWrap}>
                <span className={styles.pageSizeLabel}>Mostrar:</span>
                <div style={{ position: 'relative' }}>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className={styles.pageSizeSelect}
                    aria-label="Cantidad de productos por página"
                  >
                    <option value={12}>12 por pág.</option>
                    <option value={24}>24 por pág.</option>
                    <option value={48}>48 por pág.</option>
                    <option value={96}>96 por pág.</option>
                    <option value={1000}>Todos</option>
                  </select>
                  <ChevronDown size={14} className={styles.sortIcon} aria-hidden />
                </div>
              </div>

              <div className={styles.sortWrap}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className={styles.sortSelect}
                  aria-label="Ordenar productos"
                >
                  <option value="NEWEST">Más Recientes</option>
                  {!settings?.hidePrices && (
                    <>
                      <option value="PRICE_ASC">Menor Precio</option>
                      <option value="PRICE_DESC">Mayor Precio</option>
                    </>
                  )}
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
              <PackageX size={64} color="var(--text-muted)" className={styles.emptyIcon} />
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
            <>
              <div className={styles.grid}>
                {products.map(p => {
                  const isAvailable = p.inStock;
                  const hasImage = p.images && p.images.length > 0;
                  const price = p.price || p.basePrice || 0;
                  const hidePrices = Boolean(settings?.hidePrices);

                  return (
                    <Link key={p.id} to={`${prefix}/product/${p.id}`} className={styles.productCard}>
                      <div className={styles.imageArea}>
                        {hasImage ? (
                          <img src={p.images![0]} alt={p.name} className={styles.productImage} loading="lazy" />
                        ) : (
                          <div className={styles.placeholder}>
                            <ShoppingBag size={48} color="var(--text-primary)" className={styles.placeholderIcon} />
                            <span className={styles.placeholderLetter}>{p.name.charAt(0).toUpperCase()}</span>
                          </div>
                        )}

                        <div className={styles.badges}>
                          {!isAvailable && <span className={styles.soldOut}>Agotado</span>}
                        </div>

                        {!isMobile && (
                          <div className={styles.quickAdd}>
                            {hidePrices ? 'Consultar' : 'Ver Detalles'}
                          </div>
                        )}
                      </div>

                      <div className={styles.productBody}>
                        <span className={styles.categoryLabel}>
                          {p.brand || p.category || 'Categoría'}
                        </span>
                        <h3 className={styles.productName}>{p.name}</h3>
                        {hidePrices ? (
                          <p className={styles.productPrice} style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>
                            Consultar por WhatsApp
                          </p>
                        ) : (
                          <p className={styles.productPrice}>
                            {p.maxPrice && p.maxPrice > price
                              ? `Desde ${formatCurrency(price)}`
                              : formatCurrency(price)}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <nav className={styles.pagination} aria-label="Paginación de productos">
                  <p className={styles.paginationInfo}>
                    Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({totalProducts} productos)
                  </p>
                  <div className={styles.paginationButtons}>
                    <button
                      type="button"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className={styles.pageBtn}
                      aria-label="Página anterior"
                    >
                      <ChevronLeft size={16} /> Anterior
                    </button>
                    {getPageNumbers().map((pNum, idx) =>
                      typeof pNum === 'string' ? (
                        <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>…</span>
                      ) : (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => handlePageChange(pNum)}
                          className={clsx(styles.pageBtn, pNum === page && styles.pageBtnActive)}
                          aria-current={pNum === page ? 'page' : undefined}
                        >
                          {pNum}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className={styles.pageBtn}
                      aria-label="Página siguiente"
                    >
                      Siguiente <ChevronRight size={16} />
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
