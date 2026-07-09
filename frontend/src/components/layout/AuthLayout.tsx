import { Outlet } from 'react-router-dom';
import styles from './AuthLayout.module.css';
import { APP_CONFIG } from '@/config/app.config';

export function AuthLayout() {
  return (
    <div className={styles.shell}>
      <div className={styles.brand}>
        <div className={styles.logoMark} aria-hidden>
          {APP_CONFIG.appName.charAt(0).toUpperCase()}
        </div>
        <span className={styles.brandName}>{APP_CONFIG.appName}</span>
      </div>
      <div className={styles.card}>
        <Outlet />
      </div>
      <p className={styles.footer}>v{APP_CONFIG.appVersion}</p>
    </div>
  );
}
