import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { Sidebar }     from './Sidebar';
import { TopBar }      from './TopBar';
import { MobileNav }   from './MobileNav';
import { GlobalSearchModal } from './GlobalSearchModal';
import { useSidebarStore } from '@/store/sidebar.store';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);

  // Trigger window resize event when sidebar collapses or expands
  // This allows charts (Recharts) and data grids to resize smoothly without layout shift
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 320); // match sidebar transition duration
    return () => clearTimeout(timer);
  }, [isCollapsed]);

  return (
    <div className={clsx('spatial-workspace', styles.workspace)}>
      <GlobalSearchModal />

      {/* Desktop Sidebar Container */}
      <aside className={clsx(styles.sidebarWrapper, isCollapsed && styles.sidebarWrapperCollapsed)}>
        <Sidebar />
      </aside>

      {/* Main content canvas */}
      <div className={styles.canvas}>
        <TopBar />
        <main className={styles.content} id="main-content-area" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav & slide-over drawer */}
      <MobileNav />
    </div>
  );
}
