import { Link } from 'react-router-dom';
import { ChevronRight, Home, Search, LogOut, Sun, Moon } from 'lucide-react';
import { useBreadcrumbs } from '@/navigation/useBreadcrumbs';
import { useAuthStore }  from '@/store/auth.store';
import { useGlobalSearchStore } from '@/store/globalSearch.store';
import { authApi }       from '@/api/auth.api';
import { SyncStatusIndicator } from '@/features/offline/components/SyncStatusIndicator';
import { useThemeStore } from '@/store/theme.store';
import styles from './TopBar.module.css';

export function TopBar() {
  const crumbs = useBreadcrumbs();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { theme, toggleTheme } = useThemeStore();
  const openSearch = useGlobalSearchStore((s) => s.open);

  const handleLogout = () => { authApi.logout(); clearAuth(); };

  return (
    <header className={styles.topbar} role="banner">
      {/* Breadcrumbs (Hidden on mobile) */}
      <nav className={styles.breadcrumbs} aria-label="Ruta de navegación">
        <ol className={styles.crumbList}>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={crumb.to} className={styles.crumb}>
                {i === 0 && <Home size={14} className={styles.homeIcon} aria-hidden />}
                {isLast
                  ? <span className={styles.crumbCurrent} aria-current="page">{crumb.label}</span>
                  : <Link to={crumb.to} className={styles.crumbLink}>{crumb.label}</Link>
                }
                {!isLast && <ChevronRight size={14} className={styles.sep} aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={styles.spacer} />

      <SyncStatusIndicator />

      <button
        type="button"
        className={styles.searchBar}
        onClick={openSearch}
        aria-label="Buscar en el ERP (Ctrl+K)"
      >
        <Search size={16} color="var(--text-muted)" aria-hidden />
        <span className={styles.searchPlaceholder}>Buscar...</span>
        <kbd className={styles.searchKbd}>Ctrl K</kbd>
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        className={styles.themeBtn}
        title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className={styles.userProfile}>
        <div className={styles.avatar}>
          {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <span className={styles.userName}>{user?.fullName ?? 'Usuario'}</span>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión" aria-label="Cerrar sesión">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
