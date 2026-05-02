import { NavLink } from 'react-router-dom';
import { useNavItems } from '@/navigation/useNav';
import styles from './MobileNav.module.css';

/**
 * Bottom tab bar shown on mobile (< 1024px).
 * Displays the first 5 permitted nav items as icon tabs.
 */
export function MobileNav() {
  const items = useNavItems().slice(0, 5);

  return (
    <nav className={styles.nav} aria-label="Navegación móvil">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.tab} ${isActive ? styles.active : ''}`
            }
            aria-label={item.label}
          >
            <Icon size={20} />
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
