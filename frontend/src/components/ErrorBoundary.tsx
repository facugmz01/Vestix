import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

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
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
        background: 'var(--bg-base)', color: 'var(--text-primary)',
        padding: 32, textAlign: 'center',
      }}>
        <AlertTriangle size={48} color="var(--red)" />
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Ocurrió un error inesperado</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 420, fontSize: 14 }}>
          {this.state.error?.message ?? 'Error desconocido'}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8, padding: '10px 24px', borderRadius: 8,
            background: 'var(--accent)', color: '#fff', fontWeight: 600,
            fontSize: 14, cursor: 'pointer', border: 'none',
          }}
        >
          Recargar página
        </button>
      </div>
    );
  }
}
