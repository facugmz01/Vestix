import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ApiError } from '@/api/client';
import styles from './ApiErrorDisplay.module.css';

interface Props {
  error:    ApiError | Error | null | unknown;
  onRetry?: () => void;
}

/**
 * Consistent error block for React Query error states.
 * Accepts both our normalized ApiError and plain Error objects.
 */
export function ApiErrorDisplay({ error, onRetry }: Props) {
  if (!error) return null;

  const apiError = error as ApiError;
  const message  = apiError?.message
    ?? (error instanceof Error ? error.message : 'Ocurrió un error inesperado');
  const status   = apiError?.status;

  return (
    <div className={styles.shell} role="alert">
      <AlertCircle size={32} className={styles.icon} />
      <div className={styles.content}>
        {status && <span className={styles.code}>Error {status}</span>}
        <p className={styles.message}>{message}</p>
      </div>
      {onRetry && (
        <button className={styles.retry} onClick={onRetry} aria-label="Reintentar">
          <RefreshCw size={14} />
          Reintentar
        </button>
      )}
    </div>
  );
}
