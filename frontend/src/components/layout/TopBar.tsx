import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Home,
  Search,
  LogOut,
  Sun,
  Moon,
  Store,
  Wallet,
} from 'lucide-react';
import clsx from 'clsx';
import { useBreadcrumbs } from '@/navigation/useBreadcrumbs';
import { useAuthStore } from '@/store/auth.store';
import { useGlobalSearchStore } from '@/store/globalSearch.store';
import { authApi } from '@/api/auth.api';
import { treasuryApi } from '@/api/treasury.api';
import { SyncStatusIndicator } from '@/features/offline/components/SyncStatusIndicator';
import { useThemeStore } from '@/store/theme.store';
import { SidebarTrigger } from './SidebarTrigger';
import { ROLE_LABELS } from '@/rbac/permissions';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from './TopBar.module.css';

export function TopBar() {
  const crumbs = useBreadcrumbs();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { theme, toggleTheme } = useThemeStore();
  const openSearch = useGlobalSearchStore((s) => s.open);

  const roleLabel = user?.role ? (ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role) : '';

  // Query active cash shift to display context badge in topbar
  const { data: activeShift } = useQuery({
    queryKey: ['finance', 'treasury', 'active-shift'],
    queryFn: () => treasuryApi.getActiveShift(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: false,
  });

  const handleLogout = () => {
    authApi.logout();
    clearAuth();
  };

  return (
    <header className={styles.topbar} role="banner">
      {/* 1. Left Section: Sidebar Trigger & Breadcrumbs */}
      <div className={styles.leftSection}>
        <SidebarTrigger className={styles.sidebarTrigger} />

        <nav className={styles.breadcrumbs} aria-label="Ruta de navegación">
          <ol className={styles.crumbList}>
            {crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li key={crumb.to} className={styles.crumb}>
                  {i === 0 && <Home size={14} className={styles.homeIcon} aria-hidden />}
                  {isLast ? (
                    <span className={styles.crumbCurrent} aria-current="page">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link to={crumb.to} className={styles.crumbLink}>
                      {crumb.label}
                    </Link>
                  )}
                  {!isLast && <ChevronRight size={13} className={styles.sep} aria-hidden />}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* 2. Center / Right Section: Context Badges & Actions */}
      <div className={styles.rightSection}>
        
        {/* Branch Context Badge */}
        <div className={styles.branchBadge} title="Sucursal Activa">
          <Store size={14} className={styles.branchIcon} />
          <span className={styles.branchText}>
            {user?.branchId ? 'Sucursal Activa' : 'Casa Central'}
          </span>
        </div>

        {/* Cash Shift Status Badge */}
        <Link
          to="/admin/finance/treasury"
          className={clsx(
            styles.shiftBadge,
            activeShift ? styles.shiftActive : styles.shiftClosed
          )}
          title={
            activeShift
              ? `Caja Abierta: Turno iniciado con ${formatCurrency(activeShift.openingAmount)}`
              : 'Sin turno de caja activo'
          }
        >
          <span
            className={clsx(
              styles.shiftDot,
              activeShift && styles.shiftDotActive
            )}
          />
          <Wallet size={13} className={styles.shiftIcon} />
          <span className={styles.shiftText}>
            {activeShift ? 'Caja Abierta' : 'Caja Cerrada'}
          </span>
        </Link>

        <SyncStatusIndicator />

        {/* Global Search Trigger (Ctrl+K) */}
        <button
          type="button"
          className={styles.searchBar}
          onClick={openSearch}
          aria-label="Buscar en el ERP (Ctrl+K)"
        >
          <Search size={15} color="var(--text-muted)" aria-hidden />
          <span className={styles.searchPlaceholder}>Buscar...</span>
          <kbd className={styles.searchKbd}>Ctrl K</kbd>
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className={styles.themeBtn}
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          aria-label={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User Profile Pill */}
        <div className={styles.userProfile}>
          <div className={styles.avatar} aria-hidden>
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className={styles.userMeta}>
            <span className={styles.userName}>{user?.fullName ?? 'Usuario'}</span>
            <span className={styles.userRole}>{roleLabel}</span>
          </div>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
