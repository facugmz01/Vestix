import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { PackageX, ChevronDown, Filter, ChevronLeft, ChevronRight, X, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import { storefrontApi, StorefrontSettings } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';
import { storePrefix } from '@/utils/storefrontDomain';
import { apiClient } from '@/api/client';
import { StorefrontSEO } from '@/features/storefront/components/StorefrontSEO';
import { formatCurrency } from '@/utils/formatCurrency';
import { useDebounce } from '@/hooks/useDebounce';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { ProgressiveProductImage, ThemeProductCard } from '@/components/storefront';
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
  const [isPaused, setIsPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (isPaused || reduceMotion) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, reduceMotion, banners.length]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  const goToIndex = (index: number) => setCurrentIndex(index);

  if (!banners || banners.length === 0) return null;

  return (
    <div 
      className={styles.carousel}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-roledescription="carrusel"
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

function EditorialHero({
  storeName,
  product,
  prefix,
}: {
  storeName: string;
  product?: { name?: string; images?: string[]; id?: string };
  prefix: string;
}) {
  const image = product?.images?.map(normalizeImageUrl).find(Boolean);

  return (
    <section className={styles.editorialHero} aria-labelledby="storefront-hero-title">
      <div className={styles.editorialCopy}>
        <p className={styles.editorialKicker}>Vestix / colección diaria</p>
        <h1 id="storefront-hero-title" className={styles.editorialTitle}>
          Vestite como te sentís.
        </h1>
        <p className={styles.editorialText}>
          Prendas simples, materiales nobles y ese detalle que cambia todo. Explorá la selección de {storeName}.
        </p>
        <a className={styles.editorialCta} href="#catalogo">
          Ver la colección <ArrowUpRight size={17} aria-hidden />
        </a>
      </div>

      <div className={styles.editorialVisual}>
        {image ? (
          <ProgressiveProductImage
            src={image}
            alt={product?.name || 'Prenda destacada'}
            productName={product?.name}
            loading="eager"
            className={styles.editorialImageFrame}
            imgClassName={styles.editorialImage}
          />
        ) : (
          <div className={styles.editorialPlaceholder} aria-hidden="true">
            <span>Tu próxima</span>
            <strong>prenda favorita</strong>
          </div>
        )}
        <Link to={product?.id ? `${prefix}/product/${product.id}` : '#catalogo'} className={styles.editorialStamp}>
          <span>Descubrí</span>
          <ArrowUpRight size={18} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

export default function OnlineCatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearchTerm = searchParams.get('search') || searchParams.get('q') || '';
  
  const [searchInput, setSearchInput] = useState(urlSearchTerm);
  const debouncedSearch = useDebounce<string>(searchInput.trim(), 350);

  const readPositiveParam = (name: string, fallback: number) => {
    const value = Number(searchParams.get(name));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };

  const [categoryId, setCategoryId] = useState(() => searchParams.get('category') || '');
  const [brandId, setBrandId] = useState(() => searchParams.get('brand') || '');
  const [sortBy, setSortBy] = useState<'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST'>(() => {
    const value = searchParams.get('sort');
    return value === 'PRICE_ASC' || value === 'PRICE_DESC' ? value : 'NEWEST';
  });
  const [page, setPage] = useState(() => readPositiveParam('page', 1));
  const [pageSize, setPageSize] = useState(() => readPositiveParam('pageSize', 24));
  const hasInitializedCatalogState = useRef(false);
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

  // Keep the catalog state in the URL so browser/device back restores the exact listing.
  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    const setOrDelete = (name: string, value: string | number) => {
      if (value) nextParams.set(name, String(value));
      else nextParams.delete(name);
    };

    setOrDelete('search', debouncedSearch);
    nextParams.delete('q');
    setOrDelete('category', categoryId);
    setOrDelete('brand', brandId);
    setOrDelete('sort', sortBy === 'NEWEST' ? '' : sortBy);
    setOrDelete('page', page === 1 ? '' : page);
    setOrDelete('pageSize', pageSize === 24 ? '' : pageSize);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch, categoryId, brandId, sortBy, page, pageSize, searchParams, setSearchParams]);

  useEffect(() => {
    if (!hasInitializedCatalogState.current) {
      hasInitializedCatalogState.current = true;
      return;
    }
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
  const totalProducts = (data as any)?.metadata?.total ?? (data as any)?.total ?? products.length;
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
    nextParams.delete('category');
    nextParams.delete('brand');
    nextParams.delete('sort');
    nextParams.delete('page');
    nextParams.delete('pageSize');
    setSearchParams(nextParams, { replace: true });
  };

  const activeFiltersCount = (categoryId ? 1 : 0) + (brandId ? 1 : 0) + (debouncedSearch ? 1 : 0);
  const isEditorial = true;
  const orderedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const orderedBrands = [...brands].sort((a, b) => a.name.localeCompare(b.name, 'es'));

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
        <h4 className={styles.filterSectionTitle}>Categorías</h4>
        <div className={styles.filterList}>
          {renderFilterButton('Todas las Categorías', categoryId === '', () => {
            setCategoryId('');
            if (isMobile) setShowFiltersMobile(false);
          })}
          {orderedCategories.map(c => renderFilterButton(c.name, categoryId === c.id, () => {

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
              {orderedBrands.map(b => renderFilterButton(b.name, brandId === b.id, () => {
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

  const storeName = settings?.storeName || 'Vestix';

  return (
    <main className={styles.main}>
      <StorefrontSEO
        title="Catálogo de Productos"
        description="Explorá nuestra colección completa de productos con stock actualizado en tiempo real."
      />

      {settings?.imagesCarousel && settings.imagesCarousel.length > 0 && (
        <BannerCarousel banners={settings.imagesCarousel as Banner[]} />
      )}

      {(!settings?.imagesCarousel || settings.imagesCarousel.length === 0) && (
        <EditorialHero storeName={storeName} product={products[0]} prefix={prefix} />
      )}
      <div id="catalogo" className={styles.catalogIntro}>
        <div>
          <p className={styles.catalogKicker}>La selección</p>
          <h2 className={styles.catalogTitle}>Piezas para todos los días</h2>
        </div>
        <p className={styles.catalogDescription}>Una selección curada para combinar sin esfuerzo.</p>
      </div>

      {!isMobile && (
        <section className={styles.editorialFilterBar} aria-label="Explorar catálogo">
          <div className={styles.editorialFilterHeading}>
            <Filter size={16} aria-hidden />
            <span>Explorar por</span>
            {activeFiltersCount > 0 && <span className={styles.editorialFilterBadge}>{activeFiltersCount}</span>}
          </div>
          <label className={styles.editorialSelectLabel}>
            <span>Categoría</span>
            <select value={categoryId} onChange={event => { setCategoryId(event.target.value); setPage(1); }}>
              <option value="">Todas las categorías</option>
              {orderedCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className={styles.editorialSelectLabel}>
            <span>Marca</span>
            <select value={brandId} onChange={event => { setBrandId(event.target.value); setPage(1); }}>
              <option value="">Todas las marcas</option>
              {orderedBrands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
            </select>
          </label>
          {activeFiltersCount > 0 && <button type="button" className={styles.editorialClearFilter} onClick={clearFilters}>Limpiar</button>}
        </section>
      )}

      <div className={clsx(styles.layout, isMobile && styles.layoutMobile)}>
        {isMobile && showFiltersMobile && (
          <div className={clsx(styles.drawerOverlay, isEditorial && styles.editorialDrawerOverlay)} onClick={() => setShowFiltersMobile(false)} role="presentation">
            <div className={clsx(styles.drawer, isEditorial && styles.editorialDrawer)} onClick={e => e.stopPropagation()} role="dialog" aria-label="Filtros">
              <div className={styles.drawerHeader}>
                <h3 className={styles.drawerTitle}><Filter size={18} /> Filtros</h3>
                <button type="button" onClick={() => setShowFiltersMobile(false)} className={styles.drawerClose} aria-label="Cerrar filtros"><X size={16} aria-hidden /></button>
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
                {debouncedSearch
                  ? `No hay resultados que coincidan con "${debouncedSearch}".`
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
                {products.map(p => (
                  <ThemeProductCard
                    key={p.id}
                    product={p}
                    prefix={prefix}
                    hidePrices={Boolean(settings?.hidePrices)}
                    whatsappNumber={settings?.whatsappNumber || settings?.whatsapp}
                    whatsappMessageTemplate={settings?.whatsappMessageTemplate}
                  />
                ))}
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
