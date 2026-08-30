import { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Tag, 
  Package, 
  Barcode, 
  Info, 
  X, 
  Layers, 
  Building, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Maximize2
} from 'lucide-react';

import { 
  PageContainer, 
  Section, 
  Table, 
  Badge, 
  EmptyState, 
  TableSkeleton, 
  Tabs 
} from '@/components/ui';

import { posApi } from '@/api/pos.api';
import { priceListsApi } from '@/api/priceLists.api';
import { branchesApi } from '@/api/branches.api';
import { formatCurrency } from '@/utils/formatCurrency';
import adminStyles from '@/styles/AdminListShared.module.css';
import styles from './PriceInquiryPage.module.css';

// Audio feedback helper (synthetic tones using Web Audio API - zero external assets needed)
function playTone(type: 'success' | 'error') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3 note
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Ignore audio context errors if browser blocks autoplay
  }
}

export default function PriceInquiryPage() {
  const [search, setSearch] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastPlayedQueryRef = useRef<string>('');

  // Auto-focus input on page load and window focus
  useEffect(() => {
    inputRef.current?.focus();
    const onWindowFocus = () => inputRef.current?.focus();
    window.addEventListener('focus', onWindowFocus);
    return () => window.removeEventListener('focus', onWindowFocus);
  }, []);

  // Fetch available branches and price lists for filter options
  const { data: branchesData } = useQuery({
    queryKey: ['branches', 'list'],
    queryFn: () => branchesApi.getBranches({ pageSize: 50 }),
  });

  const { data: priceListsData } = useQuery({
    queryKey: ['price-lists', 'list'],
    queryFn: () => priceListsApi.getPriceLists({ pageSize: 50 }),
  });

  const branches = branchesData?.data || [];
  const priceLists = priceListsData?.data || [];

  // Debounce for manual typing (300ms)
  useEffect(() => {
    const cleanSearch = search.replace(/[\r\n\t]/g, '').trim();
    const timer = setTimeout(() => {
      if (cleanSearch.length >= 2) {
        setActiveQuery(cleanSearch);
      } else if (cleanSearch.length === 0) {
        setActiveQuery('');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Main price search query
  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['price-inquiry', activeQuery, selectedBranchId, selectedPriceListId],
    queryFn: () =>
      posApi.searchProduct(activeQuery, undefined, {
        branchId: selectedBranchId || undefined,
        priceListId: selectedPriceListId || undefined,
      }),
    enabled: activeQuery.length >= 2,
  });

  // Sound feedback on query resolution
  useEffect(() => {
    if (activeQuery.length >= 2 && !isLoading && lastPlayedQueryRef.current !== activeQuery) {
      lastPlayedQueryRef.current = activeQuery;
      if (results && results.length > 0) {
        playTone('success');
      } else if (results && results.length === 0) {
        playTone('error');
      }
    }
  }, [results, isLoading, activeQuery]);

  // Handle immediate barcode scanner Enter key event
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const clean = search.replace(/[\r\n\t]/g, '').trim();
      if (clean.length >= 1) {
        setActiveQuery(clean);
      }
    } else if (e.key === 'Escape') {
      setSearch('');
      setActiveQuery('');
      inputRef.current?.focus();
    }
  };

  const handleClear = useCallback(() => {
    setSearch('');
    setActiveQuery('');
    inputRef.current?.focus();
  }, []);

  // Determine if there is a primary match or variable product family to display
  const hasResults = results && results.length > 0;
  const exactMatchedItem = hasResults ? results.find((r: any) => r.isExactMatch) : null;
  const primaryItem = exactMatchedItem || (hasResults ? results[0] : null);

  // If results contain items from the same parent product, group them
  const sameProductVariants = hasResults && primaryItem
    ? results.filter((r: any) => r.productId === primaryItem.productId || r.product?.id === primaryItem.productId)
    : [];

  const isVariableFamily = sameProductVariants.length > 1;
  const otherProductResults = hasResults && primaryItem
    ? results.filter((r: any) => r.productId !== primaryItem.productId && r.product?.id !== primaryItem.productId)
    : [];

  // Images resolution
  const heroImage =
    primaryItem?.imageUrl ||
    (primaryItem?.product?.images && primaryItem.product.images.length > 0
      ? primaryItem.product.images[0]
      : null);

  return (
    <PageContainer
      tabs={<Tabs items={CATALOG_TABS} />}
      title="Consulta de Precios"
      subtitle="Verificador rápido de precios, listas y disponibilidad de stock por código de barras o SKU."
    >
      <div className={styles.container}>
        {/* ─── Search & Scanner Input Bar ───────────────────────────────── */}
        <div className={styles.searchSection}>
          <div className={styles.searchHeader}>
            <div className={styles.searchTitleRow}>
              <span className={styles.pulseDot} />
              <span>Lector de Código de Barras / SKU</span>
            </div>

            <div className={styles.filterControls}>
              <div className={styles.selectWrapper}>
                <Building size={14} />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className={styles.selectInput}
                  aria-label="Seleccionar sucursal"
                >
                  <option value="">Todas las Sucursales</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.selectWrapper}>
                <Layers size={14} />
                <select
                  value={selectedPriceListId}
                  onChange={(e) => setSelectedPriceListId(e.target.value)}
                  className={styles.selectInput}
                  aria-label="Seleccionar lista de precios"
                >
                  <option value="">Lista por Defecto</option>
                  {priceLists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} {pl.currency ? `(${pl.currency})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.searchRow}>
            <div className={styles.inputWrapper}>
              <Barcode size={22} className={styles.scanIconLeft} />
              <input
                ref={inputRef}
                type="text"
                className={styles.scanInput}
                placeholder="Escaneá un código de barras o escribí SKU / Nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                autoComplete="off"
                spellCheck="false"
              />
              {search && (
                <button
                  type="button"
                  className={styles.clearButton}
                  onClick={handleClear}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          <div className={styles.searchHint}>
            <div className={styles.hintItem}>
              <Info size={14} />
              <span>El escáner consulta automáticamente al leer el código o presionar</span>
              <kbd className={styles.kbd}>Enter</kbd>
            </div>
            <div className={styles.hintItem}>
              <span>Limpiar y reenfocar con</span>
              <kbd className={styles.kbd}>Esc</kbd>
            </div>
          </div>
        </div>

        {/* ─── Results Section ──────────────────────────────────────────── */}
        <Section>
          {!activeQuery || activeQuery.length < 2 ? (
            <EmptyState
              icon={<Barcode size={48} color="var(--text-muted)" />}
              title="Esperando lectura de código"
              message="Utilizá la pistola lectora de código de barras o escribí el SKU o nombre del artículo para verificar su precio y disponibilidad."
            />
          ) : isLoading ? (
            <TableSkeleton rows={5} />
          ) : isError ? (
            <EmptyState
              icon={<AlertCircle size={48} color="var(--red)" />}
              title="Error al consultar precios"
              message="No se pudo comunicar con el servidor. Verificá tu conexión a internet o reintentá la búsqueda."
            />
          ) : !hasResults ? (
            <EmptyState
              icon={<Package size={48} color="var(--text-muted)" />}
              title="Artículo no encontrado"
              message={`No hay productos registrados con el código o nombre "${activeQuery}". Verificá que el código de barras o SKU esté cargado en el catálogo.`}
            />
          ) : (
            <div>
              {/* ─── Hero Card for Primary Matched Product ─────────────────── */}
              {primaryItem && (
                <div
                  className={clsx(
                    styles.heroCard,
                    primaryItem.isExactMatch && styles.heroCardMatched
                  )}
                >
                  {/* Thumbnail / Image with Zoom */}
                  <div
                    className={styles.heroImageWrap}
                    onClick={() => heroImage && setPreviewImage(heroImage)}
                    role={heroImage ? 'button' : undefined}
                    tabIndex={heroImage ? 0 : undefined}
                    onKeyDown={(e) => heroImage && e.key === 'Enter' && setPreviewImage(heroImage)}
                    title={heroImage ? 'Click para ampliar imagen' : undefined}
                  >
                    {heroImage ? (
                      <img
                        src={heroImage}
                        alt={primaryItem.product?.name || primaryItem.name}
                        className={styles.heroImg}
                      />
                    ) : (
                      <div className={styles.heroImagePlaceholder}>
                        <Package size={36} />
                        <span style={{ fontSize: 11 }}>Sin Imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className={styles.heroBody}>
                    <div className={styles.heroTagRow}>
                      {primaryItem.isExactMatch && (
                        <Badge color="green">
                          <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                          Coincidencia Exacta
                        </Badge>
                      )}
                      {primaryItem.category && <Badge color="gray">{primaryItem.category}</Badge>}
                      {primaryItem.brand && <Badge color="blue">{primaryItem.brand}</Badge>}
                      {primaryItem.product?.type === 'VARIABLE' && (
                        <Badge color="purple">Producto Variable</Badge>
                      )}
                    </div>

                    <h2 className={styles.heroTitle}>
                      {primaryItem.product?.name || primaryItem.name || 'Producto Sin Nombre'}
                    </h2>

                    <div className={styles.heroMetaRow}>
                      <div className={styles.metaItem}>
                        <span>SKU Variante:</span>
                        <span className={styles.monoCode}>{primaryItem.sku}</span>
                      </div>
                      {primaryItem.barcode && (
                        <div className={styles.metaItem}>
                          <span>Código de Barras:</span>
                          <span className={styles.monoCode}>{primaryItem.barcode}</span>
                        </div>
                      )}
                      {(primaryItem.size || primaryItem.color) && (
                        <div className={styles.metaItem}>
                          <span>Atributos:</span>
                          <strong>
                            {[primaryItem.size && `Talle ${primaryItem.size}`, primaryItem.color]
                              .filter(Boolean)
                              .join(' · ')}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Stock availability breakdown per warehouse */}
                    <div className={styles.stockSection}>
                      <div className={styles.stockHeader}>
                        <span>Disponibilidad en Depósitos</span>
                        <span
                          className={clsx(
                            styles.stockValue,
                            primaryItem.stock > 0 ? styles.stockOk : styles.stockEmpty
                          )}
                        >
                          Total: {primaryItem.stock} unidades disponibles
                        </span>
                      </div>
                      <div className={styles.stockGrid}>
                        {primaryItem.stockLevels && primaryItem.stockLevels.length > 0 ? (
                          primaryItem.stockLevels.map((sl: any) => (
                            <div key={sl.id} className={styles.warehousePill}>
                              <span>{sl.warehouseName || sl.branchName || 'Depósito'}:</span>
                              <span
                                className={clsx(
                                  styles.warehousePillQty,
                                  sl.availableQuantity > 0 ? styles.qtyOk : styles.qtyZero
                                )}
                              >
                                {sl.availableQuantity} un.
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className={styles.warehousePill}>
                            <span className={styles.qtyZero}>Sin registros de stock</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prominent Price Box */}
                  <div className={styles.heroPriceBox}>
                    <div className={styles.heroPriceLabel}>
                      {primaryItem.pricing?.priceListName || 'Precio al Público'}
                    </div>

                    <div className={styles.heroPriceValue}>
                      {formatCurrency(primaryItem.basePrice || 0)}
                    </div>

                    <div className={styles.heroPriceSubtitle}>
                      {primaryItem.pricing?.taxIncluded !== false
                        ? `IVA Incluido (${primaryItem.pricing?.taxRate ?? 21}%)`
                        : `+ IVA (${primaryItem.pricing?.taxRate ?? 21}%)`}
                    </div>

                    {primaryItem.overridePrice && (
                      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                        Precio especial por lista
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── Variable Products Matrix Table ───────────────────────── */}
              {isVariableFamily && (
                <div className={styles.variantsSection}>
                  <h3 className={styles.variantsSectionTitle}>
                    <Sparkles size={16} color="var(--accent)" />
                    Variantes de este Producto ({sameProductVariants.length} talles / colores)
                  </h3>

                  <Table
                    keyField="id"
                    data={sameProductVariants}
                    columns={[
                      {
                        key: 'variant',
                        header: 'Variante / Atributos',
                        render: (v: any) => {
                          const isCurrent = v.id === primaryItem?.id;
                          return (
                            <div className={adminStyles.cellStack}>
                              <div className={styles.badgeRow}>
                                {v.size && <Badge color="gray">Talle {v.size}</Badge>}
                                {v.color && <Badge color="blue">{v.color}</Badge>}
                                {!v.size && !v.color && (
                                  <span className={adminStyles.expiryMuted}>Única</span>
                                )}
                                {isCurrent && (
                                  <span className={styles.scannedIndicator}>
                                    <CheckCircle2 size={12} /> Escaneada
                                  </span>
                                )}
                              </div>
                              <span className={styles.productSku}>{v.sku}</span>
                            </div>
                          );
                        },
                      },
                      {
                        key: 'barcode',
                        header: 'Código de Barras',
                        render: (v: any) => (
                          <span className={styles.monoCode}>{v.barcode || '—'}</span>
                        ),
                      },
                      {
                        key: 'price',
                        header: 'Precio',
                        render: (v: any) => (
                          <div className={adminStyles.cellStack}>
                            <span className={styles.priceValue}>
                              {formatCurrency(v.basePrice || 0)}
                            </span>
                            <span className={adminStyles.cellMutedXs}>
                              {v.pricing?.priceListName || 'Lista General'}
                            </span>
                          </div>
                        ),
                      },
                      {
                        key: 'stock',
                        header: 'Stock Total',
                        render: (v: any) => {
                          const stockCount = v.stock ?? 0;
                          return (
                            <div className={adminStyles.cellStack}>
                              <span
                                className={clsx(
                                  styles.stockValue,
                                  stockCount > 0 ? styles.stockOk : styles.stockEmpty
                                )}
                              >
                                {stockCount} unidades
                              </span>
                              <span className={adminStyles.cellMutedXs}>
                                En {v.stockLevels?.length || 0} depósitos
                              </span>
                            </div>
                          );
                        },
                      },
                    ]}
                  />
                </div>
              )}

              {/* ─── Other Matching Products Table (if multi-search) ──────── */}
              {otherProductResults.length > 0 && (
                <div className={styles.variantsSection} style={{ marginTop: 24 }}>
                  <h3 className={styles.variantsSectionTitle}>
                    Otros Artículos que Coinciden ({otherProductResults.length})
                  </h3>

                  <Table
                    keyField="id"
                    data={otherProductResults}
                    columns={[
                      {
                        key: 'image',
                        header: '',
                        render: (v: any) => {
                          const imgUrl =
                            v.imageUrl ||
                            (v.product?.images && v.product.images.length > 0
                              ? v.product.images[0]
                              : null);
                          return (
                            <div
                              className={styles.thumb}
                              onClick={() => imgUrl && setPreviewImage(imgUrl)}
                              role={imgUrl ? 'button' : undefined}
                              tabIndex={imgUrl ? 0 : undefined}
                              onKeyDown={(e) =>
                                imgUrl && e.key === 'Enter' && setPreviewImage(imgUrl)
                              }
                            >
                              {imgUrl ? (
                                <img src={imgUrl} alt={v.sku} className={styles.thumbImg} />
                              ) : (
                                <div className={styles.thumbPlaceholder}>
                                  <Package size={20} />
                                </div>
                              )}
                            </div>
                          );
                        },
                      },
                      {
                        key: 'product',
                        header: 'Producto',
                        render: (v: any) => (
                          <div className={adminStyles.cellStack}>
                            <span className={styles.productName}>
                              {v.product?.name || v.name || 'Producto Desconocido'}
                            </span>
                            <span className={styles.productSku}>{v.sku}</span>
                          </div>
                        ),
                      },
                      {
                        key: 'attributes',
                        header: 'Talle / Color',
                        render: (v: any) => (
                          <div className={styles.badgeRow}>
                            {v.size && <Badge color="gray">{v.size}</Badge>}
                            {v.color && <Badge color="blue">{v.color}</Badge>}
                            {!v.size && !v.color && (
                              <span className={adminStyles.expiryMuted}>Única</span>
                            )}
                          </div>
                        ),
                      },
                      {
                        key: 'price',
                        header: 'Precio al Público',
                        render: (v: any) => (
                          <div className={adminStyles.cellStack}>
                            <span className={styles.priceValue}>
                              {formatCurrency(v.basePrice || 0)}
                            </span>
                            <span className={adminStyles.cellMutedXs}>
                              {v.pricing?.priceListName || 'IVA Incluido'}
                            </span>
                          </div>
                        ),
                      },
                      {
                        key: 'stock',
                        header: 'Disponibilidad Total',
                        render: (v: any) => {
                          const totalStock = v.stock ?? 0;
                          return (
                            <div className={adminStyles.cellStack}>
                              <span
                                className={clsx(
                                  styles.stockValue,
                                  totalStock > 0 ? styles.stockOk : styles.stockEmpty
                                )}
                              >
                                {totalStock} unidades
                              </span>
                              <span className={adminStyles.cellMutedXs}>
                                En {v.stockLevels?.length || 0} depósitos
                              </span>
                            </div>
                          );
                        },
                      },
                    ]}
                  />
                </div>
              )}
            </div>
          )}
        </Section>

        {/* ─── Lightbox Modal for High-Res Image Preview ────────────────── */}
        {previewImage && (
          <div
            className={styles.lightbox}
            onClick={() => setPreviewImage(null)}
            role="presentation"
          >
            <img src={previewImage} alt="Preview ampliado" className={styles.lightboxImg} />
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setPreviewImage(null)}
              aria-label="Cerrar vista previa"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
