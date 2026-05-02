import { ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './ErrorPages.module.css';

/** Rendered when backend returns HTTP 403 (RBAC failure). */
export default function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className={styles.shell}>
      <ShieldOff size={52} className={styles.icon} />
      <h1 className={styles.code}>403</h1>
      <h2 className={styles.title}>Acceso denegado</h2>
      <p className={styles.desc}>
        No tenés los permisos necesarios para ver esta sección.
        Contactá a tu administrador si creés que esto es un error.
      </p>
      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={() => navigate('/admin')}>
          Volver al Dashboard
        </button>
        <button className={styles.btnSecondary} onClick={() => navigate(-1)}>
          Volver atrás
        </button>
      </div>
    </div>
  );
}
