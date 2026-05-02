import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useBreadcrumbs } from '@/navigation/useBreadcrumbs';
import styles from './TopBar.module.css';

export function TopBar() {
  const crumbs = useBreadcrumbs();

  return (
    <header className={styles.topbar} role="banner">
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs} aria-label="Ruta de navegación">
        <ol className={styles.crumbList}>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={crumb.to} className={styles.crumb}>
                {i === 0 && <Home size={13} className={styles.homeIcon} aria-hidden />}
                {isLast
                  ? <span className={styles.crumbCurrent} aria-current="page">{crumb.label}</span>
                  : <Link to={crumb.to} className={styles.crumbLink}>{crumb.label}</Link>
                }
                {!isLast && <ChevronRight size={13} className={styles.sep} aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>
    </header>
  );
}
