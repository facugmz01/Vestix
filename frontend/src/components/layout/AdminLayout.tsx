import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar }     from './Sidebar';
import { TopBar }      from './TopBar';
import { MobileNav }   from './MobileNav';
import { GlobalSearchModal } from './GlobalSearchModal';
import { useAuthStore } from '@/store/auth.store';
import { isDeliveryOnlyUser } from '@/rbac/homeRoute';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  const user = useAuthStore((s) => s.user);

  if (isDeliveryOnlyUser(user)) {
    return <Navigate to="/delivery" replace />;
  }

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
