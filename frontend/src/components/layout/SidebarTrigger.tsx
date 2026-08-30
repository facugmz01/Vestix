import React from 'react';
import { Menu, X, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import clsx from 'clsx';
import styles from './SidebarTrigger.module.css';

interface SidebarTriggerProps {
  className?: string;
  showDesktopState?: boolean;
}

/**
 * Control único y centralizado de colapso/expansión de la barra lateral (Sidebar)
 * para todo el sistema Vestix.
 * - En Desktop (>= 1024px): Alterna entre modo compacto (72px) y completo (272px).
 * - En Mobile (< 1024px): Alterna la apertura/cierre del Drawer de navegación.
 */
export const SidebarTrigger: React.FC<SidebarTriggerProps> = ({
  className,
}) => {
  const {
    isCollapsed,
    isMobileOpen,
    toggleSidebar,
    toggleMobileSidebar,
  } = useSidebarStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  const isExpandedDesktop = !isCollapsed;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(styles.trigger, className)}
      aria-label="Alternar barra lateral"
      aria-expanded={isExpandedDesktop}
      title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
    >
      {/* Icono Desktop: PanelLeftClose / PanelLeftOpen */}
      <span className={styles.desktopIcon} aria-hidden="true">
        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </span>

      {/* Icono Mobile: Menu / X */}
      <span className={styles.mobileIcon} aria-hidden="true">
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </span>
    </button>
  );
};
