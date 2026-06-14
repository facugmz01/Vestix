import { NavLink } from 'react-router-dom';
import { LogOut }   from 'lucide-react';
import { useNavGroups }  from '@/navigation/useNav';
import { ROLE_LABELS }   from '@/rbac/permissions';
import { useAuthStore }  from '@/store/auth.store';
import { authApi }       from '@/api/auth.api';
import { APP_CONFIG }    from '@/config/app.config';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const user      = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const groups    = useNavGroups();
  const roleLabel = user?.role ? (ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role) : '';

  const handleLogout = () => { authApi.logout(); clearAuth(); };

  return (
    <aside className={styles.sidebar} aria-label="Navegación principal">
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.logoMark} aria-hidden />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className={styles.logoText}>{APP_CONFIG.appName}</span>
          <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, marginTop: '-2px' }}>v{APP_CONFIG.appVersion}</span>
        </div>
      </div>

      {/* Permission-filtered grouped navigation */}
      <nav className={styles.nav}>
        {groups.map((group) => (
          <div key={group.id} className={styles.group}>
            <span className={styles.groupLabel}>{group.label}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                  aria-label={item.label}
                >
                  <Icon size={17} className={styles.navIcon} aria-hidden />
                  <span className={styles.navLabel}>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User block */}
      <div className={styles.user}>
        <div className={styles.avatar} aria-hidden>
          {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user?.fullName ?? 'Usuario'}</span>
          <span className={styles.userRole}>{roleLabel}</span>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
