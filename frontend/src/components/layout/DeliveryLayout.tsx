import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Truck, LogOut, Package } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { ROLE_LABELS } from '@/rbac/permissions';
import styles from './DeliveryLayout.module.css';

export function DeliveryLayout() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const roleLabel = user?.role ? (ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role) : '';

  const handleLogout = () => {
    authApi.logout();
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Truck size={22} />
          <div>
            <strong>Delivery</strong>
            <span>{user?.fullName || user?.email}</span>
          </div>
        </div>
        <button type="button" className={styles.logout} onClick={handleLogout} aria-label="Cerrar sesión">
          <LogOut size={18} />
        </button>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <nav className={styles.bottomNav} aria-label="Navegación delivery">
        <NavLink to="/delivery" end className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
          <Package size={20} />
          <span>Mis envíos</span>
        </NavLink>
        <div className={styles.roleBadge}>{roleLabel}</div>
      </nav>
    </div>
  );
}
