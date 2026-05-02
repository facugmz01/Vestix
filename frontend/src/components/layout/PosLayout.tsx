import { Outlet } from 'react-router-dom';
import { ArrowLeft, WifiOff, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { usePosStore }  from '@/store/pos.store';
import styles from './PosLayout.module.css';
import { APP_CONFIG } from '@/config/app.config';
import { useState, useEffect } from 'react';

/**
 * Full-screen POS layout.
 * No sidebar — maximum screen real-estate for the cashier interface.
 * Shows connectivity status and current operator.
 */
export function PosLayout() {
  const navigate  = useNavigate();
  const user      = useAuthStore((s) => s.user);
  const lineCount = usePosStore((s) => s.lines.length);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const up   = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online',  up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);

  return (
    <div className={styles.shell}>
      {/* POS top strip */}
      <header className={styles.header}>
        <div className={styles.left}>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/admin')}
            aria-label="Volver al panel"
          >
            <ArrowLeft size={16} />
          </button>
          <span className={styles.brandName}>{APP_CONFIG.appName} · POS</span>
        </div>

        <div className={styles.center}>
          {lineCount > 0 && (
            <span className={styles.cartBadge}>{lineCount} ítem{lineCount > 1 ? 's' : ''} en carrito</span>
          )}
        </div>

        <div className={styles.right}>
          <span className={`${styles.connectivity} ${online ? styles.online : styles.offline}`}>
            {online
              ? <><Wifi size={14} /> En línea</>
              : <><WifiOff size={14} /> Sin conexión</>
            }
          </span>
          <span className={styles.operator}>{user?.fullName}</span>
        </div>
      </header>

      {/* POS content area */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
