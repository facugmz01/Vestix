import { PageContainer, Section } from '@/components/ui';
import { SyncQueuePanel } from '@/features/offline/components/SyncQueuePanel';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import { Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react';

export default function SyncStatusPage() {
  const { isOnline } = useNetworkStatus();
  const operations   = useOfflineQueueStore((s) => s.operations);

  const stats = {
    pending:  operations.filter(o => o.status === 'PENDING').length,
    syncing:  operations.filter(o => o.status === 'SYNCING').length,
    failed:   operations.filter(o => o.status === 'FAILED').length,
    conflict: operations.filter(o => o.status === 'CONFLICT').length,
  };

  return (
    <PageContainer
      title="Estado de Sincronización"
      subtitle="Cola de operaciones offline pendientes de envío al servidor."
    >
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Conexión" value={isOnline ? 'En Línea' : 'Offline'} icon={isOnline ? <Wifi size={20} /> : <WifiOff size={20} />} color={isOnline ? 'var(--green)' : 'var(--red)'} />
        <StatCard label="Pendientes" value={String(stats.pending + stats.syncing)} icon={<Clock size={20} />} color="var(--orange)" />
        <StatCard label="Con Errores" value={String(stats.failed)} icon={<AlertTriangle size={20} />} color={stats.failed > 0 ? 'var(--red)' : 'var(--text-muted)'} />
        <StatCard label="Conflictos" value={String(stats.conflict)} icon={<AlertTriangle size={20} />} color={stats.conflict > 0 ? 'var(--orange)' : 'var(--text-muted)'} />
      </div>

      <Section>
        <SyncQueuePanel />
      </Section>
    </PageContainer>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</p>
        <div style={{ color }}>{icon}</div>
      </div>
      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color }}>{value}</h2>
    </div>
  );
}
