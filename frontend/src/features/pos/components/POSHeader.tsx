import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Clock, PauseCircle, Maximize, Calculator, LogOut, Sun, Moon, Search, Copy, Receipt, Keyboard } from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { db } from '@/core/db/db';
import { PosSyncPanel, SyncStatusIndicatorClickable } from './PosSyncPanel';
import { CalculatorModal } from './CalculatorModal';
import styles from '@/pages/pos/POSPage.module.css';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span>{time.toLocaleTimeString()}</span>;
}

interface POSHeaderProps {
  branchId?: string;
  isOnline: boolean;
  isSyncing: boolean;
  lastCatalogSync: string | null;
  catalogCount: number;
  onForceSync: () => Promise<void>;
  onForceCatalogSync?: (full?: boolean) => Promise<unknown>;
  search: string;
  setSearch: (s: string) => void;
  searchInputRef: React.Ref<HTMLInputElement>;
  onSearchEnter: () => void;
  onDuplicateLastSale: () => void;
  hasLastSale: boolean;
}

export function POSHeader({
  branchId,
  isOnline,
  isSyncing,
  lastCatalogSync,
  catalogCount,
  onForceSync,
  onForceCatalogSync,
  search,
  setSearch,
  searchInputRef,
  onSearchEnter,
  onDuplicateLastSale,
  hasLastSale,
}: POSHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const setShiftModalOpen = usePosStore(s => s.setShiftModalOpen);
  const setShiftSalesDrawerOpen = usePosStore(s => s.setShiftSalesDrawerOpen);
  const setSuspendModalOpen = usePosStore(s => s.setSuspendModalOpen);
  const syncPanelOpen = usePosStore(s => s.syncPanelOpen);
  const setSyncPanelOpen = usePosStore(s => s.setSyncPanelOpen);
  const suspendedSales = usePosStore(s => s.suspendedSales);
  const { theme, toggleTheme } = useThemeStore();
  const [calcOpen, setCalcOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const pendingCount = useLiveQuery(
    () => db.syncQueue.where('status').equals('PENDING').count(),
    [],
  ) ?? 0;

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <>
      <div className={styles.navbar}>
        <div className={styles.navLeft}>
          <div className={styles.navLogo}>
            <span>Vestix</span> POS
          </div>
          {user?.fullName && (
            <span className={styles.cashierBadge}>{user.fullName}</span>
          )}
        </div>

        <div className={styles.navSearch}>
          <Search size={18} className={styles.navSearchIcon} />
          <input
            ref={searchInputRef}
            type="text"
            className={styles.navSearchInput}
            placeholder="Buscar producto, SKU o código (F2)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') onSearchEnter();
            }}
            aria-label="Buscar productos"
          />
        </div>

        <div className={styles.navIcons}>
          <SyncStatusIndicatorClickable
            onClick={() => setSyncPanelOpen(true)}
            isOnline={isOnline}
            pendingCount={pendingCount}
            catalogCount={catalogCount}
          />
          <div className={styles.iconBtn}><Clock size={16} /> <LiveClock /></div>
          <button type="button" className={styles.iconBtn} onClick={() => setShiftSalesDrawerOpen(true)} title="Ventas del turno">
            <Receipt size={18} />
          </button>
          {hasLastSale && (
            <button type="button" className={styles.iconBtn} onClick={onDuplicateLastSale} title="Duplicar última venta (Ctrl+D)">
              <Copy size={18} />
            </button>
          )}
          <button type="button" className={styles.iconBtn} onClick={() => setSuspendModalOpen(true)} title="Ventas Suspendidas">
            <PauseCircle size={18} />
            {suspendedSales.length > 0 && (
              <span style={{ background: 'var(--yellow)', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                {suspendedSales.length}
              </span>
            )}
          </button>
          <button type="button" className={styles.iconBtn} onClick={() => setShowShortcuts(s => !s)} title="Atajos de teclado">
            <Keyboard size={18} />
          </button>
          <button type="button" className={styles.iconBtn} onClick={toggleFullScreen} title="Pantalla Completa"><Maximize size={18} /></button>
          <button type="button" className={styles.iconBtn} onClick={() => setCalcOpen(true)} title="Calculadora"><Calculator size={18} /></button>
          <button type="button" className={styles.iconBtn} onClick={toggleTheme} title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button type="button" className={styles.iconBtn} onClick={() => setShiftModalOpen(true)} style={{ background: 'rgba(220,38,38,0.2)', color: '#f87171', border: '1px solid rgba(220,38,38,0.4)' }} title="Cerrar Caja">
            <LogOut size={16} /> Cerrar Caja
          </button>
          <button type="button" className={styles.iconBtn} onClick={() => navigate('/')} title="Volver al Dashboard"><LogOut size={18} /> Volver</button>
        </div>
      </div>

      {showShortcuts && (
        <div className={styles.shortcutsBar}>
          <span><kbd>F2</kbd> Buscar</span>
          <span><kbd>F4</kbd> Cobrar efectivo</span>
          <span><kbd>F1</kbd>–<kbd>F8</kbd> Favoritos</span>
          <span><kbd>Ctrl+D</kbd> Duplicar venta</span>
          <span><kbd>Esc</kbd> Limpiar búsqueda</span>
        </div>
      )}

      <PosSyncPanel
        open={syncPanelOpen}
        onClose={() => setSyncPanelOpen(false)}
        branchId={branchId}
        isOnline={isOnline}
        isSyncing={isSyncing}
        lastCatalogSync={lastCatalogSync}
        catalogCount={catalogCount}
        onForceSync={onForceSync}
        onForceCatalogSync={onForceCatalogSync}
      />

      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}
