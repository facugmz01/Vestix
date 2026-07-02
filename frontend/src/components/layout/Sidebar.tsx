import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, ChevronRight, ChevronLeft } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

  const handleLogout = () => { authApi.logout(); clearAuth(); };

  return (
    <aside className={`${styles.dock} ${isExpanded ? styles.expanded : ''}`} aria-label="Navegación principal">
      {/* Brand Logo only */}
      <div className={styles.dockLogo} aria-hidden>
        {APP_CONFIG.appName.charAt(0)}
      </div>

      <button 
        className={styles.toggleBtn} 
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? "Colapsar menú" : "Expandir menú"}
      >
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Navigation */}
      <nav className={styles.nav}>
        {groups.map((group) => (
          <div key={group.id} className={styles.group}>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `${styles.dockItem} ${isActive ? styles.active : ''}`
                  }
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon size={20} className={styles.navIcon} aria-hidden />
                  {isExpanded && <span className={styles.navLabel}>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
