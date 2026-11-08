import { useCallback, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { clearApplicationCache } from '@/core/cache/applicationCache';
import styles from './AppUpdateBanner.module.css';

function waitAtMost(promise: Promise<unknown>, timeoutMs: number): Promise<void> {
  return Promise.race([
    promise.then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
}

export function AppUpdateBanner() {
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const update = useCallback(async () => {
    setIsUpdating(true);
    try {
      // Cache cleanup is best-effort. A locked IndexedDB/cache entry must not
      // leave the update button spinning forever.
      await waitAtMost(clearApplicationCache(), 5000);

      // Some browsers do not resolve updateServiceWorker(true) after sending
      // SKIP_WAITING. Keep listening briefly, then reload as a safe fallback.
      const updateRequest = updateServiceWorker(true).catch((error: unknown) => {
        console.error('[AppUpdateBanner] No se pudo activar el service worker', error);
      });
      await waitAtMost(updateRequest, 3000);
      window.location.reload();
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
