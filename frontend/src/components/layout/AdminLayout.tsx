import { Outlet } from 'react-router-dom';
import { Sidebar }     from './Sidebar';
import { TopBar }      from './TopBar';
import { MobileNav }   from './MobileNav';
import { GlobalSearchModal } from './GlobalSearchModal';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  return (
    <div className="spatial-workspace">
      <GlobalSearchModal />
      {/* Desktop Dock (formerly sidebar) */}
      <div className={styles.dockWrapper}>
        <Sidebar />
      </div>

      {/* Main content canvas */}
      <div className={styles.canvas}>
        <TopBar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
