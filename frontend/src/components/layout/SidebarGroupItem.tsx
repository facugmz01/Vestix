import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import type { NavItem, NavSubItem } from '@/navigation/navConfig';
import styles from './Sidebar.module.css';

interface SidebarGroupItemProps {
  item: NavItem;
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Ítem de navegación padre con submenús (acordeón).
 * Estrictamente renderizado como <button type="button"> (NUNCA como enlace).
 * Su única acción al hacer clic es expandir/colapsar sus rutas hijas.
 */
export const SidebarGroupItem: React.FC<SidebarGroupItemProps> = ({
  item,
  isCollapsed,
  isExpanded,
  onToggle,
}) => {
  const location = useLocation();
  const Icon = item.icon;
  const children = item.children || [];

  // Comprobar si alguna de las rutas hijas está activa en la URL actual
  const isAnyChildActive = children.some(
    (c) =>
      location.pathname === c.to ||
      (c.to !== '/admin' && location.pathname.startsWith(c.to + '/'))
  );

  const groupId = `group-subnav-${item.id}`;

  if (isCollapsed) {
    // En modo colapsado, el ítem se muestra como botón compacto que resalta si tiene una ruta activa
    return (
      <button
        type="button"
        className={clsx(
          styles.navItem,
          isAnyChildActive && styles.active
        )}
        title={item.label}
        aria-label={item.label}
        aria-expanded={isExpanded}
        aria-controls={groupId}
      >
        <Icon size={18} className={styles.itemIcon} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className={styles.groupContainer}>
      {/* Botón Padre Acordeón: No navega, solo ejecuta el toggle */}
      <button
        type="button"
        className={clsx(
          styles.parentButton,
          isAnyChildActive && styles.parentActive,
          isExpanded && styles.parentExpanded
        )}
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
        aria-expanded={isExpanded}
        aria-controls={groupId}
        aria-label={`${isExpanded ? 'Colapsar' : 'Expandir'} submenú de ${item.label}`}
      >
        <div className={styles.parentLeft}>
          <Icon size={18} className={styles.itemIcon} aria-hidden="true" />
          <span className={styles.itemLabel}>{item.label}</span>
          {item.badge && <span className={styles.badge}>{item.badge}</span>}
        </div>

        <ChevronDown
          size={16}
          className={clsx(
            styles.chevronIcon,
            isExpanded && styles.chevronIconExpanded
          )}
          aria-hidden="true"
        />
      </button>

      {/* Contenedor de Submenús con Transición Suave */}
      <div
        id={groupId}
        className={clsx(
          styles.accordionWrapper,
          isExpanded ? styles.accordionOpen : styles.accordionClosed
        )}
        role="region"
        aria-label={`Submenús de ${item.label}`}
      >
        <div className={styles.accordionInner}>
          <div className={styles.childrenContainer}>
            {children.map((child: NavSubItem) => {
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
                  <span className={styles.childDot} aria-hidden="true" />
                  {SubIcon && (
                    <SubIcon size={14} className={styles.childIcon} aria-hidden="true" />
                  )}
                  <span className={styles.childLabel}>{child.label}</span>
                  {child.badge && (
                    <span className={styles.badge}>{child.badge}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
