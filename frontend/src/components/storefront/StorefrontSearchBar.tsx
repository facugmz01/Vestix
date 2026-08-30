import { useState, useEffect, useRef, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Loader2, Package, ArrowRight, AlertCircle, ShoppingBag } from 'lucide-react';
import clsx from 'clsx';
import { storefrontApi, type StorefrontProduct } from '@/api/storefront.api';
import { storePrefix } from '@/utils/storefrontDomain';
import { formatCurrency } from '@/utils/formatCurrency';
import { useDebounce } from '@/hooks/useDebounce';
import styles from './StorefrontSearchBar.module.css';

export interface StorefrontSearchBarProps {
  placeholder?: string;
  initialValue?: string;
  onSearchSubmit?: (searchTerm: string) => void;
  hideDropdown?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  hidePrices?: boolean;
  syncUrl?: boolean;
}

export function StorefrontSearchBar({
  placeholder = 'Buscar productos, marcas, SKUs...',
  initialValue = '',
  onSearchSubmit,
  hideDropdown = false,
  autoFocus = false,
  className,
  inputClassName,
  hidePrices = false,
  syncUrl = true,
}: StorefrontSearchBarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefix = storePrefix();

  const urlQuery = searchParams.get('search') || searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(initialValue || (syncUrl ? urlQuery : ''));
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state if URL query changes externally and syncUrl is true
  useEffect(() => {
    if (syncUrl && urlQuery !== inputValue && !isOpen) {
      setInputValue(urlQuery);
    }
  }, [urlQuery, syncUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce the search term (350ms) to avoid spamming the backend API
  const debouncedTerm = useDebounce<string>(inputValue.trim(), 350);

  // TanStack Query for live autocomplete suggestions with automatic signal cancellation
  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['storefront', 'quickSearch', debouncedTerm],
    queryFn: ({ signal }) => storefrontApi.searchQuick(debouncedTerm, 6, { signal }),
    enabled: Boolean(debouncedTerm && debouncedTerm.length >= 2 && !hideDropdown),
    staleTime: 30_000,
  });

  const products: StorefrontProduct[] = data?.data || [];
  const totalCount = data?.metadata?.total ?? products.length;
  const showDropdownPanel =
    !hideDropdown &&
    isOpen &&
    inputValue.trim().length >= 2;

  // Handle outside click to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeFullSearch = useCallback((term: string) => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();

    const sanitized = term.trim();
    if (onSearchSubmit) {
      onSearchSubmit(sanitized);
      return;
    }

    if (syncUrl) {
      const target = sanitized
        ? `${prefix}/?search=${encodeURIComponent(sanitized)}`
        : `${prefix}/`;
      navigate(target);
    }
  }, [onSearchSubmit, prefix, navigate, syncUrl]);

  const handleSelectProduct = useCallback((product: StorefrontProduct) => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
    navigate(`${prefix}/product/${product.id}`);
  }, [navigate, prefix]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && highlightedIndex < products.length) {
      handleSelectProduct(products[highlightedIndex]);
    } else {
      executeFullSearch(inputValue);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdownPanel) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    const maxIndex = products.length > 0 ? products.length : -1; // index `products.length` is "View all results"

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < maxIndex ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < products.length) {
        handleSelectProduct(products[highlightedIndex]);
      } else {
        executeFullSearch(inputValue);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
    if (onSearchSubmit) {
      onSearchSubmit('');
    } else if (syncUrl && urlQuery) {
      navigate(`${prefix}/`);
    }
  };

  return (
    <div ref={containerRef} className={clsx(styles.searchContainer, className)}>
      <form className={styles.searchForm} onSubmit={handleSubmit} role="search">
        <div className={styles.inputWrapper}>
          <Search size={16} className={styles.searchIcon} aria-hidden />

          <input
            ref={inputRef}
            type="search"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => {
              if (inputValue.trim().length >= 2) {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={clsx(styles.searchInput, inputClassName)}
            autoFocus={autoFocus}
            autoComplete="off"
            aria-label={placeholder}
            aria-expanded={showDropdownPanel}
            aria-autocomplete="list"
          />

          <div className={styles.inputActions}>
            {isFetching && (
              <Loader2 size={15} className={styles.spinner} aria-label="Buscando..." />
            )}

            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className={styles.clearButton}
                aria-label="Limpiar término de búsqueda"
                title="Limpiar búsqueda"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </form>

      {/* ─── Autocomplete / Quick Results Dropdown ───────────────────────── */}
      {showDropdownPanel && (
        <div className={styles.dropdown} role="listbox">
          <div className={styles.dropdownHeader}>
            <span>Resultados sugeridos</span>
            {isFetching && <span>Actualizando…</span>}
          </div>

          {isLoading ? (
            <div className={styles.stateMessage}>
              <Loader2 size={24} className={styles.spinner} />
              <span className={styles.stateSubtitle}>Buscando coincidencias…</span>
            </div>
          ) : isError ? (
            <div className={styles.stateMessage}>
              <AlertCircle size={24} className={styles.stateIcon} />
              <div className={styles.stateTitle}>Error al buscar</div>
              <div className={styles.stateSubtitle}>No se pudo conectar con el catálogo. Intentá nuevamente.</div>
            </div>
          ) : products.length === 0 ? (
            <div className={styles.stateMessage}>
              <Package size={28} className={styles.stateIcon} />
              <div className={styles.stateTitle}>Sin resultados</div>
              <div className={styles.stateSubtitle}>
                No se encontraron productos para &ldquo;<strong>{debouncedTerm}</strong>&rdquo;. Verificá la ortografía o probá con otros términos.
              </div>
            </div>
          ) : (
            <>
              <ul className={styles.resultsList}>
                {products.map((product, idx) => {
                  const isHighlighted = highlightedIndex === idx;
                  const thumb = Array.isArray(product.images) && product.images.length > 0
                    ? product.images[0]
                    : null;

                  return (
                    <li
                      key={product.id}
                      role="option"
                      aria-selected={isHighlighted}
                      className={clsx(styles.resultItem, isHighlighted && styles.resultItemActive)}
                      onClick={() => handleSelectProduct(product)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                    >
                      <div className={styles.productThumbnail}>
                        {thumb ? (
                          <img src={thumb} alt={product.name} className={styles.thumbnailImg} loading="lazy" />
                        ) : (
                          <ShoppingBag size={18} />
                        )}
                      </div>

                      <div className={styles.productInfo}>
                        <span className={styles.productName} title={product.name}>
                          {product.name}
                        </span>
                        <div className={styles.productMeta}>
                          {product.category && <span className={styles.badge}>{product.category}</span>}
                          {product.brand && <span className={styles.badge}>{product.brand}</span>}
                          {product.variants && product.variants.length > 1 && (
                            <span className={styles.badge}>{product.variants.length} variantes</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.productPriceBlock}>
                        {!hidePrices ? (
                          <span className={styles.price}>
                            {formatCurrency(product.price)}
                          </span>
                        ) : (
                          <span className={styles.priceInquiry}>Consultar</span>
                        )}

                        <span
                          className={clsx(
                            styles.stockStatus,
                            product.inStock ? styles.inStock : styles.outOfStock
                          )}
                        >
                          {product.inStock ? 'En stock' : 'Agotado'}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className={styles.dropdownFooter}>
                <button
                  type="button"
                  onClick={() => executeFullSearch(inputValue)}
                  className={clsx(
                    styles.viewAllButton,
                    highlightedIndex === products.length && styles.resultItemActive
                  )}
                  onMouseEnter={() => setHighlightedIndex(products.length)}
                >
                  Ver todos los resultados ({totalCount}) <ArrowRight size={14} />
                </button>
                <div className={styles.keyboardTip}>
                  <span>Navegá con</span>
                  <kbd className={styles.kbd}>↑</kbd>
                  <kbd className={styles.kbd}>↓</kbd>
                  <span>y</span>
                  <kbd className={styles.kbd}>Enter</kbd>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
