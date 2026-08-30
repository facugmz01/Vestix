import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Zap } from 'lucide-react';
import clsx from 'clsx';
import { useNavGroups } from '@/navigation/useNav';
import type { NavItem } from '@/navigation/navConfig';
import { useSidebarStore } from '@/store/sidebar.store';
import { APP_CONFIG } from '@/config/app.config';
import { SidebarItem } from './SidebarItem';
import { SidebarGroupItem } from './SidebarGroupItem';
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
    expandedGroups,
    toggleGroup,
    setGroupExpanded,
  } = useSidebarStore();

  // Popover flotante al pasar el cursor en modo colapsado (Desktop mini-bar)
  const [hoveredFlyout, setHoveredFlyout] = useState<HoveredFlyout | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  // Auto-expandir el grupo padre si la ruta actual pertenece a uno de sus hijos
  useEffect(() => {
    segments.forEach((segment) => {
      segment.items.forEach((item) => {
        if (item.children && item.children.length > 0) {
          const isCurrentActive =
            location.pathname === item.to ||
            item.children.some(
              (c) =>
                location.pathname === c.to ||
                (c.to !== '/admin' && location.pathname.startsWith(c.to + '/'))
            );

          if (isCurrentActive && !expandedGroups.includes(item.id)) {
            setGroupExpanded(item.id, true);
          }
        }
      });
    });
  }, [location.pathname, segments, expandedGroups, setGroupExpanded]);

  // Cerrar flyout al cambiar de ruta o cambiar estado de colapso
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

    // Mantener el popover dentro del viewport
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

  return (
    <aside
      className={clsx(styles.sidebar, isCollapsed && styles.collapsed)}
      aria-label="Navegación principal del sistema"
    >
      {/* ── 1. HEADER (Branding limpio, sin botones duplicados de toggle) ───── */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandLogo} aria-hidden="true">
            <span>{APP_CONFIG.appName.charAt(0)}</span>
          </div>
          {!isCollapsed && (
            <div className={styles.brandMeta}>
              <span className={styles.brandTitle}>{APP_CONFIG.appName}</span>
              <span className={styles.brandSubtitle}>Retail ERP Suite</span>
            </div>
          )}
        </div>
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
          <Zap size={18} className={styles.posIcon} aria-hidden="true" />
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
                const hasChildren = Boolean(item.children && item.children.length > 0);
                const isGroupExpanded = expandedGroups.includes(item.id);

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
                    {hasChildren ? (
                      <SidebarGroupItem
                        item={item}
                        isCollapsed={isCollapsed}
                        isExpanded={isGroupExpanded}
                        onToggle={() => toggleGroup(item.id)}
                      />
                    ) : (
                      <SidebarItem
                        item={item}
                        isCollapsed={isCollapsed}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── 4. FLOATING FLYOUT POPOVER EN MODO COLAPSADO ───────────────────── */}
      {isCollapsed && hoveredFlyout && (
        <div
          className={styles.fixedFlyoutPopover}
          style={{
            top: `${hoveredFlyout.top}px`,
            left: `${hoveredFlyout.left}px`,
          }}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="dialog"
          aria-label={hoveredFlyout.item.label}
        >
          <div className={styles.flyoutHeader}>
            <span className={styles.flyoutTitle}>{hoveredFlyout.item.label}</span>
          </div>

          <div className={styles.flyoutBody}>
            {/* Si no tiene hijos, link a la vista directa */}
            {(!hoveredFlyout.item.children || hoveredFlyout.item.children.length === 0) && (
              <NavLink
                to={hoveredFlyout.item.to}
                end={hoveredFlyout.item.end}
                className={({ isActive }) =>
                  clsx(styles.flyoutLink, isActive && styles.flyoutLinkActive)
                }
                onClick={() => setHoveredFlyout(null)}
              >
                <span className={styles.flyoutBullet}>•</span>
                <span>{hoveredFlyout.item.label}</span>
              </NavLink>
            )}

            {/* Si tiene hijos, lista de submódulos reales */}
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
                  {child.badge && (
                    <span className={styles.badge}>{child.badge}</span>
                  )}
                </NavLink>
              ))}
          </div>
        </div>
      )}
    </aside>
  );
}
