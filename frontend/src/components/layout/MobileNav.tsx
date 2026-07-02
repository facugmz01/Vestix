import { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  const mainItems = items.slice(0, 4); // First 4 items go to the bottom bar
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
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        title="Menú Principal"
        position="right"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px 0' }}>
          {groups.map(group => (
            <div key={group.id}>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px', paddingLeft: '12px', fontWeight: 600 }}>
                {group.label}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.to}
                      end={item.end}
                      onClick={() => setIsMenuOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                        textDecoration: 'none', borderRadius: '8px',
                        color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                        background: isActive ? 'var(--bg-elevated)' : 'transparent',
                        fontWeight: isActive ? 600 : 500,
                        transition: 'background 0.2s'
                      })}
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
