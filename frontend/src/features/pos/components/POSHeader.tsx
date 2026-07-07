import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Clock, PauseCircle, Maximize, Calculator, LogOut, Sun, Moon } from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
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
}

export function POSHeader({
  branchId,
  isOnline,
  isSyncing,
  lastCatalogSync,
  catalogCount,
  onForceSync,
  onForceCatalogSync,
}: POSHeaderProps) {
  const navigate = useNavigate();
  const setShiftModalOpen = usePosStore(s => s.setShiftModalOpen);
  const setSuspendModalOpen = usePosStore(s => s.setSuspendModalOpen);
  const syncPanelOpen = usePosStore(s => s.syncPanelOpen);
  const setSyncPanelOpen = usePosStore(s => s.setSyncPanelOpen);
  const suspendedSales = usePosStore(s => s.suspendedSales);
  const { theme, toggleTheme } = useThemeStore();
  const [calcOpen, setCalcOpen] = useState(false);

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
        <div className={styles.navLogo}>
          <span>Vestix</span> POS
        </div>
        <div className={styles.navIcons}>
          <SyncStatusIndicatorClickable
            onClick={() => setSyncPanelOpen(true)}
            isOnline={isOnline}
            pendingCount={pendingCount}
            catalogCount={catalogCount}
          />
          <div className={styles.iconBtn}><Clock size={16} /> <LiveClock /></div>
          <button className={styles.iconBtn} onClick={() => setSuspendModalOpen(true)} title="Ventas Suspendidas">
            <PauseCircle size={18} /> 
            {suspendedSales.length > 0 && <span style={{ background: 'var(--yellow)', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{suspendedSales.length}</span>}
          </button>
          <button className={styles.iconBtn} onClick={toggleFullScreen} title="Pantalla Completa"><Maximize size={18} /></button>
          <button className={styles.iconBtn} onClick={() => setCalcOpen(true)} title="Calculadora"><Calculator size={18} /></button>
          
          <button className={styles.iconBtn} onClick={toggleTheme} title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className={styles.iconBtn} onClick={() => setShiftModalOpen(true)} style={{ background: 'rgba(220,38,38,0.2)', color: '#f87171', border: '1px solid rgba(220,38,38,0.4)' }} title="Cerrar Caja">
            <LogOut size={16} /> Cerrar Caja
          </button>
          <button className={styles.iconBtn} onClick={() => navigate('/')} title="Volver al Dashboard"><LogOut size={18} /> Volver</button>
        </div>
      </div>

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
