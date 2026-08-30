import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebar.store';
import clsx from 'clsx';
import styles from './SidebarTrigger.module.css';

interface Props {
  className?: string;
  showDesktopState?: boolean;
}

export function SidebarTrigger({ className, showDesktopState = true }: Props) {
  const { isCollapsed, toggleCollapse, toggleMobile } = useSidebarStore();

  const handleClick = () => {
    // Check if we are on a mobile screen (< 1024px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      toggleMobile();
    } else {
      toggleCollapse();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(styles.trigger, className)}
      aria-label={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
      title={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
    >
      {/* On desktop show PanelLeftOpen / PanelLeftClose icon */}
      <span className={styles.desktopIcon}>
        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
      </span>
      {/* On mobile show standard hamburger Menu icon */}
      <span className={styles.mobileIcon}>
        <Menu size={20} />
      </span>
    </button>
  );
}
