import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import { useNavGroups } from '@/navigation/useNav';
import type { NavItem, NavSubItem } from '@/navigation/navConfig';
import { useSidebarStore } from '@/store/sidebar.store';
import { APP_CONFIG } from '@/config/app.config';
import styles from './Sidebar.module.css';

interface HoveredFlyout {
  item: NavItem;
  top: number;
  left: number;
}

export function Sidebar() {
  const location = useLocation();
  const segments = useNavGroups();

  const {
    isCollapsed,
    toggleCollapse,
    expandedGroups,
    toggleGroup,
    setGroupExpanded,
  } = useSidebarStore();

  // Active hover tooltip item in collapsed mode positioned via fixed viewport coordinates
  const [hoveredFlyout, setHoveredFlyout] = useState<HoveredFlyout | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Auto-expand group if current route is inside it
  useEffect(() => {
    segments.forEach((segment) => {
      segment.items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          const isCurrentActive =
            location.pathname === item.to ||
            item.children.some(
              (c) => location.pathname === c.to || location.pathname.startsWith(c.to + '/')
            );
          if (isCurrentActive && !expandedGroups[item.id]) {
            setGroupExpanded(item.id, true);
          }
        }
      });
    });
  }, [location.pathname]);

  // Close flyout on scroll or route change
  useEffect(() => {
    setHoveredFlyout(null);
  }, [location.pathname, isCollapsed]);

  const handleMouseEnter = (item: NavItem, e: React.MouseEvent<HTMLElement>) => {
    if (!isCollapsed) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const estimatedHeight = 50 + (item.children?.length ?? 0) * 36;
    let targetTop = rect.top;

    // Keep popover inside screen bounds
    if (targetTop + estimatedHeight > windowHeight - 16) {
      targetTop = Math.max(16, windowHeight - estimatedHeight - 16);
    }

    setHoveredFlyout({
      item,
      top: targetTop,
      left: rect.right + 10,
    });
  };

  const handleMouseLeave = () => {
    if (!isCollapsed) return;
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredFlyout(null);
    }, 140);
  };

  const handlePopoverMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHoveredFlyout(null);
    toggleCollapse();
  };

  return (
    <aside
      className={clsx(styles.sidebar, isCollapsed && styles.collapsed)}
      aria-label="Navegación principal del sistema"
    >
      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div
          className={styles.brand}
          onClick={isCollapsed ? handleToggleClick : undefined}
          title={isCollapsed ? 'Clic para expandir menú' : undefined}
          role={isCollapsed ? 'button' : undefined}
          tabIndex={isCollapsed ? 0 : undefined}
          onKeyDown={(e) => {
            if (isCollapsed && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              toggleCollapse();
            }
          }}
        >
          <div className={styles.brandLogo} aria-hidden>
            <span>{APP_CONFIG.appName.charAt(0)}</span>
          </div>
          {!isCollapsed && (
            <div className={styles.brandMeta}>
              <span className={styles.brandTitle}>{APP_CONFIG.appName}</span>
              <span className={styles.brandSubtitle}>Retail ERP Suite</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className={styles.collapseToggle}
          onClick={handleToggleClick}
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* ── 2. QUICK POS LAUNCHER ─────────────────────────────────────────── */}
      <div className={styles.quickActionArea}>
        <NavLink
          to="/pos"
          className={({ isActive }) =>
            clsx(styles.posButton, isActive && styles.posButtonActive)
          }
          title="Terminal POS (F9)"
        >
          <Zap size={18} className={styles.posIcon} />
          {!isCollapsed && (
            <div className={styles.posLabelContainer}>
              <span className={styles.posLabel}>Terminal POS</span>
              <span className={styles.posBadge}>F9</span>
            </div>
          )}
        </NavLink>
      </div>

      {/* ── 3. SEGMENTED NAVIGATION TREE ──────────────────────────────────── */}
      <nav
        className={styles.nav}
        role="navigation"
        onScroll={() => {
          if (isCollapsed && hoveredFlyout) setHoveredFlyout(null);
        }}
      >
        {segments.map((segment) => (
          <div key={segment.id} className={styles.segment}>
            {!isCollapsed && (
              <div className={styles.segmentTitle}>
                <span>{segment.label}</span>
              </div>
            )}
            {isCollapsed && <div className={styles.segmentDivider} />}

            <div className={styles.itemList}>
              {segment.items.map((item) => {
                const Icon = item.icon;
                const hasChildren = Boolean(item.children && item.children.length > 0);
                const isGroupExpanded = Boolean(expandedGroups[item.id]);
                const isItemActive =
                  location.pathname === item.to ||
                  (item.children &&
                    item.children.some(
                      (c) =>
                        location.pathname === c.to ||
                        location.pathname.startsWith(c.to + '/')
                    ));

                return (
                  <div
                    key={item.id}
                    className={clsx(
                      styles.itemWrapper,
                      isCollapsed && styles.itemWrapperCollapsed
                    )}
                    onMouseEnter={(e) => handleMouseEnter(item, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Top-level Nav Item */}
                    {hasChildren && !isCollapsed ? (
                      <div
                        className={clsx(
                          styles.parentRow,
                          isItemActive && styles.parentRowActive
                        )}
                      >
                        <NavLink
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            clsx(styles.parentLink, isActive && styles.activeLink)
                          }
                          title={item.label}
                        >
                          <Icon size={18} className={styles.itemIcon} aria-hidden />
                          <span className={styles.itemLabel}>{item.label}</span>
                          {item.badge && (
                            <span className={styles.badge}>{item.badge}</span>
                          )}
                        </NavLink>

                        <button
                          type="button"
                          className={styles.chevronButton}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleGroup(item.id);
                          }}
                          aria-label={
                            isGroupExpanded
                              ? `Colapsar submenú de ${item.label}`
                              : `Desplegar submenú de ${item.label}`
                          }
                        >
                          {isGroupExpanded ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          clsx(
                            styles.navItem,
                            (isActive || (isCollapsed && isItemActive)) && styles.active
                          )
                        }
                        title={isCollapsed ? item.label : undefined}
                        aria-label={item.label}
                      >
                        <Icon size={18} className={styles.itemIcon} aria-hidden />
                        {!isCollapsed && (
                          <span className={styles.itemLabel}>{item.label}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <span className={styles.badge}>{item.badge}</span>
                        )}
                      </NavLink>
                    )}

                    {/* Sub-items (Expanded in Desktop) */}
                    {!isCollapsed && hasChildren && isGroupExpanded && (
                      <div className={styles.childrenContainer}>
                        {item.children!.map((child: NavSubItem) => {
                          const SubIcon = child.icon;
                          return (
                            <NavLink
                              key={child.id}
                              to={child.to}
                              end={child.end}
                              className={({ isActive }) =>
                                clsx(
                                  styles.childItem,
                                  isActive && styles.childItemActive
                                )
                              }
                            >
                              <span className={styles.childDot} />
                              {SubIcon && (
                                <SubIcon size={14} className={styles.childIcon} />
                              )}
                              <span className={styles.childLabel}>{child.label}</span>
                              {child.badge && (
                                <span className={styles.badge}>{child.badge}</span>
                              )}
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── 4. FIXED FLOATING FLYOUT POPOVER IN COLLAPSED MODE ─────────────── */}
      {isCollapsed && hoveredFlyout && (
        <div
          className={styles.fixedFlyoutPopover}
          style={{
            top: `${hoveredFlyout.top}px`,
            left: `${hoveredFlyout.left}px`,
          }}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className={styles.flyoutHeader}>
            <span className={styles.flyoutTitle}>{hoveredFlyout.item.label}</span>
          </div>

          <div className={styles.flyoutBody}>
            {/* Direct link to main view */}
            <NavLink
              to={hoveredFlyout.item.to}
              end={hoveredFlyout.item.end}
              className={({ isActive }) =>
                clsx(styles.flyoutLink, isActive && styles.flyoutLinkActive)
              }
              onClick={() => setHoveredFlyout(null)}
            >
              <span className={styles.flyoutBullet}>•</span>
              <span>Vista Principal</span>
            </NavLink>

            {/* Submodule child links */}
            {hoveredFlyout.item.children &&
              hoveredFlyout.item.children.map((child) => (
                <NavLink
                  key={child.id}
                  to={child.to}
                  end={child.end}
                  className={({ isActive }) =>
                    clsx(styles.flyoutLink, isActive && styles.flyoutLinkActive)
                  }
                  onClick={() => setHoveredFlyout(null)}
                >
                  <span className={styles.flyoutBullet}>•</span>
                  <span>{child.label}</span>
                </NavLink>
              ))}
          </div>
        </div>
      )}
    </aside>
  );
}
