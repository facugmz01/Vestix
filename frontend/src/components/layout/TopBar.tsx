import { Link } from 'react-router-dom';
import { ChevronRight, Home, Search, LogOut } from 'lucide-react';
import { useBreadcrumbs } from '@/navigation/useBreadcrumbs';
import { useAuthStore }  from '@/store/auth.store';
import { authApi }       from '@/api/auth.api';
import styles from './TopBar.module.css';

export function TopBar() {
  const crumbs = useBreadcrumbs();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  
  const handleLogout = () => { authApi.logout(); clearAuth(); };

  return (
    <header className={styles.topbar} role="banner">
      {/* Breadcrumbs */}
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

      <div className={styles.searchBar}>
        <Search size={16} color="var(--text-3)" />
        <input type="text" placeholder="Buscar en el ERP..." />
      </div>

      <div className={styles.userProfile}>
        <div className={styles.avatar}>
          {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <span className={styles.userName}>{user?.fullName ?? 'Usuario'}</span>
        <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
