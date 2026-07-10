import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, X, Package, Users, ShoppingCart, Truck, LayoutGrid, Loader2,
} from 'lucide-react';
import clsx from 'clsx';

import { productsApi } from '@/api/products.api';
import { customersApi } from '@/api/customers.api';
import { salesApi } from '@/api/sales.api';
import { suppliersApi } from '@/api/suppliers.api';
import { queryKeys } from '@/api/queryKeys';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavItems } from '@/navigation/useNav';
import { usePermissions } from '@/rbac/usePermissions';
import { useGlobalSearchStore } from '@/store/globalSearch.store';
import { formatSaleId, stripDisplayPrefix } from '@/utils/formatId';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Customer, Product, ProductVariant, SaleOrder, Supplier } from '@/types';
import styles from './GlobalSearchModal.module.css';

type ResultKind = 'page' | 'product' | 'variant' | 'customer' | 'sale' | 'supplier';

interface SearchResult {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle?: string;
  to: string;
}

const KIND_META: Record<ResultKind, { label: string; icon: typeof Search }> = {
  page: { label: 'Páginas', icon: LayoutGrid },
  product: { label: 'Productos', icon: Package },
  variant: { label: 'Variantes / SKU', icon: Package },
  customer: { label: 'Clientes', icon: Users },
  sale: { label: 'Ventas', icon: ShoppingCart },
  supplier: { label: 'Proveedores', icon: Truck },
};

function normalizeSalesQuery(raw: string): string {
  const trimmed = raw.trim();
  if (/^[VP]-/i.test(trimmed)) {
    return stripDisplayPrefix(trimmed);
  }
  return trimmed;
}

export function GlobalSearchModal() {
  const isOpen = useGlobalSearchStore((s) => s.isOpen);
  const close = useGlobalSearchStore((s) => s.close);
  const toggle = useGlobalSearchStore((s) => s.toggle);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { can } = usePermissions();
  const navItems = useNavItems();

  const debouncedQuery = useDebounce(query.trim(), 300);
  const canSearch = debouncedQuery.length >= 2;

  const canCatalog = can('read', 'Catalog');
  const canCustomers = can('read', 'Customers');
  const canSales = can('read', 'Sales');
  const canPurchasing = can('read', 'Purchasing');

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && useGlobalSearchStore.getState().isOpen) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, close]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  const pageResults = useMemo<SearchResult[]>(() => {
    if (!canSearch) return [];
    const q = debouncedQuery.toLowerCase();
    const seen = new Set<string>();
    return navItems
      .filter((item) => {
        if (seen.has(item.to)) return false;
        seen.add(item.to);
        return item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      })
      .slice(0, 5)
      .map((item) => ({
        id: `page-${item.id}`,
        kind: 'page' as const,
        title: item.label,
        subtitle: item.to,
        to: item.to,
      }));
  }, [canSearch, debouncedQuery, navItems]);

  const { data: productsData, isFetching: productsLoading } = useQuery({
    queryKey: queryKeys.products.all({ search: debouncedQuery, pageSize: 5, global: true }),
    queryFn: () => productsApi.getProducts({ search: debouncedQuery, pageSize: 5 }),
    enabled: isOpen && canSearch && canCatalog,
  });

  const { data: variantsData, isFetching: variantsLoading } = useQuery({
    queryKey: ['global-search', 'variants', debouncedQuery],
    queryFn: () => productsApi.getVariants(debouncedQuery),
    enabled: isOpen && canSearch && canCatalog,
  });

  const { data: customersData, isFetching: customersLoading } = useQuery({
    queryKey: queryKeys.customers.all({ search: debouncedQuery, pageSize: 5, global: true }),
    queryFn: () => customersApi.getCustomers({ search: debouncedQuery, pageSize: 5 }),
    enabled: isOpen && canSearch && canCustomers,
  });

  const salesQuery = normalizeSalesQuery(debouncedQuery);
  const { data: salesData, isFetching: salesLoading } = useQuery({
    queryKey: queryKeys.sales.all({ search: salesQuery, pageSize: 5, global: true }),
    queryFn: () => salesApi.getSales({ search: salesQuery, pageSize: 5 }),
    enabled: isOpen && canSearch && canSales,
  });

  const { data: suppliersData, isFetching: suppliersLoading } = useQuery({
    queryKey: queryKeys.suppliers.all({ search: debouncedQuery, pageSize: 5, global: true }),
    queryFn: () => suppliersApi.getSuppliers({ search: debouncedQuery, pageSize: 5 }),
    enabled: isOpen && canSearch && canPurchasing,
  });

  const productResults = useMemo<SearchResult[]>(() => {
    const products: Product[] = Array.isArray(productsData)
      ? productsData
      : (productsData?.data ?? []);
    return products.slice(0, 5).map((p) => ({
      id: `product-${p.id}`,
      kind: 'product' as const,
      title: p.name,
      subtitle: p.baseSku ? `SKU ${p.baseSku}` : undefined,
      to: `/admin/catalog/${p.id}/edit`,
    }));
  }, [productsData]);

  const variantResults = useMemo<SearchResult[]>(() => {
    const variants = (variantsData ?? []) as Array<ProductVariant & { product?: Product }>;
    const productIds = new Set(productResults.map((r) => r.to.split('/')[3]));
    return variants
      .filter((v) => v.productId && !productIds.has(v.productId))
      .slice(0, 5)
      .map((v) => ({
        id: `variant-${v.id}`,
        kind: 'variant' as const,
        title: v.product?.name ?? v.sku,
        subtitle: [v.sku, v.barcode, v.size, v.color].filter(Boolean).join(' · '),
        to: `/admin/catalog/${v.productId}/edit`,
      }));
  }, [variantsData, productResults]);

  const customerResults = useMemo<SearchResult[]>(() => {
    const customers: Customer[] = customersData?.data ?? [];
    return customers.slice(0, 5).map((c) => ({
      id: `customer-${c.id}`,
      kind: 'customer' as const,
      title: c.fullName,
      subtitle: [c.email, c.phone, c.taxId].filter(Boolean).join(' · '),
      to: `/admin/customers?search=${encodeURIComponent(c.fullName)}`,
    }));
  }, [customersData]);

  const saleResults = useMemo<SearchResult[]>(() => {
    const sales: SaleOrder[] = salesData?.data ?? [];
    return sales.slice(0, 5).map((s) => ({
      id: `sale-${s.id}`,
      kind: 'sale' as const,
      title: formatSaleId(s.id, s.status),
      subtitle: `${s.customerName || s.customer?.fullName || 'Consumidor Final'} · ${formatCurrency(s.grandTotal)}`,
      to: `/admin/sales?id=${encodeURIComponent(s.id)}`,
    }));
  }, [salesData]);

  const supplierResults = useMemo<SearchResult[]>(() => {
    const suppliers: Supplier[] = suppliersData?.data ?? [];
    return suppliers.slice(0, 5).map((s) => ({
      id: `supplier-${s.id}`,
      kind: 'supplier' as const,
      title: s.companyName,
      subtitle: [s.contactName, s.taxId, s.email].filter(Boolean).join(' · '),
      to: `/admin/suppliers?search=${encodeURIComponent(s.companyName)}`,
    }));
  }, [suppliersData]);

  const grouped = useMemo(() => {
    const sections: Array<{ kind: ResultKind; items: SearchResult[] }> = [];
    const push = (kind: ResultKind, items: SearchResult[]) => {
      if (items.length) sections.push({ kind, items });
    };
    push('page', pageResults);
    push('product', productResults);
    push('variant', variantResults);
    push('customer', customerResults);
    push('sale', saleResults);
    push('supplier', supplierResults);
    return sections;
  }, [pageResults, productResults, variantResults, customerResults, saleResults, supplierResults]);

  const flatResults = useMemo(
    () => grouped.flatMap((section) => section.items),
    [grouped],
  );

  const isLoading =
    canSearch &&
    (productsLoading || variantsLoading || customersLoading || salesLoading || suppliersLoading);

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery, flatResults.length]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const goTo = (result: SearchResult) => {
    close();
    navigate(result.to);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (flatResults[activeIndex]) {
      goTo(flatResults[activeIndex]);
      return;
    }
    if (query.trim() && canCatalog) {
      close();
      navigate(`/admin/catalog?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!flatResults.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + flatResults.length) % flatResults.length);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={close}
      role="presentation"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda global"
      >
        <form className={styles.searchForm} onSubmit={handleSubmit}>
          <Search size={20} className={styles.icon} aria-hidden />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar productos, clientes, ventas, páginas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
            aria-autocomplete="list"
            aria-controls="global-search-results"
            autoComplete="off"
          />
          {isLoading && <Loader2 size={18} className={styles.spinner} aria-label="Buscando" />}
          <button type="button" className={styles.closeBtn} onClick={close} aria-label="Cerrar">
            <X size={20} />
          </button>
        </form>

        <div id="global-search-results" className={styles.results} ref={listRef} role="listbox">
          {!canSearch && (
            <p className={styles.helperText}>
              Escribí al menos 2 caracteres. También podés abrir esto con Ctrl+K.
            </p>
          )}

          {canSearch && !isLoading && flatResults.length === 0 && (
            <p className={styles.helperText}>
              Sin resultados para “{debouncedQuery}”. Enter busca en el catálogo.
            </p>
          )}

          {grouped.map((section) => {
            const meta = KIND_META[section.kind];
            const Icon = meta.icon;
            const sectionStart = flatResults.findIndex((r) => r.kind === section.kind);
            return (
              <div key={section.kind} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <Icon size={14} aria-hidden />
                  <span>{meta.label}</span>
                </div>
                {section.items.map((item, i) => {
                  const index = sectionStart + i;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      data-index={index}
                      className={clsx(styles.resultItem, index === activeIndex && styles.resultActive)}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(item)}
                    >
                      <span className={styles.resultTitle}>{item.title}</span>
                      {item.subtitle && (
                        <span className={styles.resultSubtitle}>{item.subtitle}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>Enter</kbd> abrir</span>
          <span><kbd>Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}
