import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Zap,
  LayoutDashboard,
  Package,
  ShoppingCart,
} from 'lucide-react';
import { useNavGroups } from '@/navigation/useNav';
import type { NavItem, NavSubItem } from '@/navigation/navConfig';
import { useSidebarStore } from '@/store/sidebar.store';
import { APP_CONFIG } from '@/config/app.config';
import styles from './MobileNav.module.css';

/**
 * Mobile navigation:
 * 1. Fixed bottom quick bar (< 768px)
 * 2. Left Slide-over Mobile Drawer synchronized with TopBar hamburger trigger and useSidebarStore.
 */
export function MobileNav() {
  const location = useLocation();
  const segments = useNavGroups();
  const { isMobileOpen, closeMobile, setMobileOpen, expandedGroups, toggleGroup } = useSidebarStore();

  // Close drawer on route change
  useEffect(() => {
    closeMobile();
  }, [location.pathname, closeMobile]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        closeMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, closeMobile]);

  return (
    <>
      {/* ── 1. BOTTOM QUICK TAB BAR (< 768px) ─────────────────────────────── */}
      <nav className={styles.bottomBar} aria-label="Navegación rápida móvil">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            clsx(styles.bottomTab, isActive && styles.bottomTabActive)
          }
          aria-label="Dashboard"
        >
          <LayoutDashboard size={20} />
          <span className={styles.bottomTabLabel}>Inicio</span>
        </NavLink>

        <NavLink
          to="/admin/catalog"
          className={({ isActive }) =>
            clsx(styles.bottomTab, isActive && styles.bottomTabActive)
          }
          aria-label="Catálogo"
        >
          <Package size={20} />
          <span className={styles.bottomTabLabel}>Catálogo</span>
        </NavLink>

        <NavLink
          to="/pos"
          className={({ isActive }) =>
            clsx(styles.bottomTab, styles.posQuickTab, isActive && styles.bottomTabActive)
          }
          aria-label="Terminal POS"
        >
          <Zap size={22} className={styles.posTabIcon} />
          <span className={styles.bottomTabLabel}>POS</span>
        </NavLink>

        <NavLink
          to="/admin/sales"
          className={({ isActive }) =>
            clsx(styles.bottomTab, isActive && styles.bottomTabActive)
          }
          aria-label="Ventas"
        >
          <ShoppingCart size={20} />
          <span className={styles.bottomTabLabel}>Ventas</span>
        </NavLink>

        <button
          type="button"
          className={clsx(styles.bottomTab, isMobileOpen && styles.bottomTabActive)}
          onClick={() => setMobileOpen(!isMobileOpen)}
          aria-label="Abrir menú completo"
        >
          <Menu size={20} />
          <span className={styles.bottomTabLabel}>Menú</span>
        </button>
      </nav>

      {/* ── 2. MOBILE DRAWER WITH BACKDROP (Synchronized with useSidebarStore) ── */}
      {isMobileOpen && (
        <div
          className={styles.backdrop}
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(styles.mobileDrawer, isMobileOpen && styles.drawerOpen)}
        aria-modal="true"
        role="dialog"
        aria-label="Menú principal de navegación"
      >
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerBrand}>
            <div className={styles.drawerLogo}>
              {APP_CONFIG.appName.charAt(0)}
            </div>
            <div>
              <span className={styles.drawerTitle}>{APP_CONFIG.appName}</span>
              <span className={styles.drawerSubtitle}>Menú Principal</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeMobile}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        {/* POS Direct Launcher in Drawer */}
        <div className={styles.drawerPosLauncher}>
          <NavLink
            to="/pos"
            onClick={closeMobile}
            className={styles.drawerPosBtn}
          >
            <Zap size={18} />
            <span>Terminal POS (F9)</span>
          </NavLink>
        </div>

        {/* Drawer Navigation List */}
        <div className={styles.drawerNavStack}>
          {segments.map((segment) => (
            <div key={segment.id} className={styles.drawerSegment}>
              <h4 className={styles.drawerSegmentTitle}>{segment.label}</h4>

              <div className={styles.drawerLinks}>
                {segment.items.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = Boolean(item.children && item.children.length > 0);
                  const isExpanded = Boolean(expandedGroups[item.id]);

                  return (
                    <div key={item.id} className={styles.drawerItemWrapper}>
                      {hasChildren ? (
                        <div>
                          <div className={styles.drawerParentRow}>
                            <NavLink
                              to={item.to}
                              end={item.end}
                              onClick={closeMobile}
                              className={({ isActive }) =>
                                clsx(
                                  styles.drawerLink,
                                  isActive && styles.drawerLinkActive
                                )
                              }
                            >
                              <Icon size={18} />
                              <span>{item.label}</span>
                            </NavLink>

                            <button
                              type="button"
                              className={styles.drawerChevronBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroup(item.id);
                              }}
                              aria-label="Alternar submenú"
                            >
                              {isExpanded ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </button>
                          </div>

                          {isExpanded && (
                            <div className={styles.drawerSubLinks}>
                              {item.children!.map((child: NavSubItem) => {
                                const SubIcon = child.icon;
                                return (
                                  <NavLink
                                    key={child.id}
                                    to={child.to}
                                    end={child.end}
                                    onClick={closeMobile}
                                    className={({ isActive }) =>
                                      clsx(
                                        styles.drawerSubLink,
                                        isActive && styles.drawerSubLinkActive
                                      )
                                    }
                                  >
                                    <span className={styles.drawerSubDot} />
                                    {SubIcon && <SubIcon size={14} />}
                                    <span>{child.label}</span>
                                  </NavLink>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={closeMobile}
                          className={({ isActive }) =>
                            clsx(
                              styles.drawerLink,
                              isActive && styles.drawerLinkActive
                            )
                          }
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </NavLink>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
