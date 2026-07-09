import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './ErrorBoundary.module.css';

interface Props   { children: ReactNode; fallback?: ReactNode; }
interface State   { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback)  return this.props.fallback;

    return (
      <div className={styles.shell}>
        <AlertTriangle size={48} color="var(--red)" />
        <h2 className={styles.title}>Ocurrió un error inesperado</h2>
        <p className={styles.message}>
          {this.state.error?.message ?? 'Error desconocido'}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={styles.btnPrimary}
          >
            Recargar página
          </button>
          <button
            type="button"
            onClick={async () => {
              if (window.confirm('¿Estás seguro de que deseas limpiar la caché local? Perderás ventas offline no sincronizadas.')) {
                localStorage.clear();
                const dbs = await window.indexedDB.databases();
                dbs.forEach(db => { if (db.name) window.indexedDB.deleteDatabase(db.name); });
                window.location.reload();
              }
            }}
            className={styles.btnSecondary}
          >
            Limpiar caché
          </button>
        </div>
      </div>
    );
  }
}
