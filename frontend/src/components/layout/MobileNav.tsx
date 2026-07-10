import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { Menu } from 'lucide-react';
import { useNavItems, useNavGroups } from '@/navigation/useNav';
import { Drawer } from '@/components/ui/Drawer';
import styles from './MobileNav.module.css';

/**
 * Bottom tab bar shown on mobile (< 1024px).
 * Displays the first 4 permitted nav items as icon tabs, and a Menu button for the rest.
 */
export function MobileNav() {
  const items = useNavItems();
  const groups = useNavGroups();
  const mainItems = items.slice(0, 4);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav} aria-label="Navegación móvil">
        {mainItems.map((item) => {
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
              onClick={() => setIsMenuOpen(false)}
            >
              <Icon size={20} />
              <span className={styles.label}>{item.label}</span>
            </NavLink>
          );
        })}
        {items.length > 4 && (
          <button 
            type="button"
            className={styles.tab} 
            onClick={() => setIsMenuOpen(true)}
            aria-label="Más opciones"
          >
            <Menu size={20} />
            <span className={styles.label}>Menú</span>
          </button>
        )}
      </nav>

      <Drawer 
        open={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        title="Menú Principal"
        side="right"
      >
        <div className={styles.menuStack}>
          {groups.map(group => (
            <div key={group.id}>
              <h4 className={styles.menuGroupTitle}>
                {group.label}
              </h4>
              <div className={styles.menuLinks}>
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.to}
                      end={item.end}
                      onClick={() => setIsMenuOpen(false)}
                      className={({ isActive }) => clsx(styles.menuLink, isActive && styles.menuLinkActive)}
                    >
                      <Icon size={18} />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Drawer>
    </>
  );
}
