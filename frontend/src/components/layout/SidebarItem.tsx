import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import type { NavItem } from '@/navigation/navConfig';
import styles from './Sidebar.module.css';

interface SidebarItemProps {
  item: NavItem;
  isCollapsed: boolean;
}

/**
 * Ítem de navegación hoja (sin hijos/submenús).
 * Renderiza un <NavLink> tradicional que ejecuta la navegación directa
 * y resalta automáticamente el estado activo según la URL.
 */
export const SidebarItem: React.FC<SidebarItemProps> = ({ item, isCollapsed }) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        clsx(
          styles.navItem,
          isActive && styles.active
        )
      }
      title={isCollapsed ? item.label : undefined}
      aria-label={item.label}
    >
      <Icon size={18} className={styles.itemIcon} aria-hidden="true" />
      {!isCollapsed && <span className={styles.itemLabel}>{item.label}</span>}
      {!isCollapsed && item.badge && (
        <span className={styles.badge}>{item.badge}</span>
      )}
    </NavLink>
  );
};
