import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar }     from './Sidebar';
import { TopBar }      from './TopBar';
import { MobileNav }   from './MobileNav';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  return (
    <div className={styles.shell}>
      {/* Desktop sidebar */}
      <div className={styles.sidebarWrapper}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className={styles.main}>
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
