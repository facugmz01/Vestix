import { useCallback, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { clearApplicationCache } from '@/core/cache/applicationCache';
import styles from './AppUpdateBanner.module.css';

export function AppUpdateBanner() {
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const update = useCallback(async () => {
    setIsUpdating(true);
    try {
      await clearApplicationCache();
      await updateServiceWorker(true);
    } catch (error) {
      console.error('[AppUpdateBanner] No se pudo aplicar la actualización', error);
      window.location.reload();
    }
  }, [updateServiceWorker]);

  if (!needRefresh) return null;

  return (
    <aside className={styles.banner} role="status" aria-live="polite">
      <div className={styles.copy}>
        <RefreshCw size={18} aria-hidden="true" />
        <div>
          <strong>Hay una nueva versión de Vestix</strong>
          <span>Actualizá para cargar los cambios y limpiar la caché local.</span>
        </div>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.updateButton}
          onClick={update}
          disabled={isUpdating}
        >
          <RefreshCw size={15} className={isUpdating ? styles.spin : undefined} aria-hidden="true" />
          {isUpdating ? 'Actualizando…' : 'Actualizar ahora'}
        </button>
        <button
          type="button"
          className={styles.dismissButton}
          onClick={() => setNeedRefresh(false)}
          disabled={isUpdating}
          aria-label="Recordar más tarde"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
