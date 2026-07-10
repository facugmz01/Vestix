import clsx from 'clsx';
import { 
  PageContainer, Section
} from '@/components/ui';
import { SyncQueuePanel } from '@/features/offline/components/SyncQueuePanel';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import { Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react';
import adminStyles from '@/styles/AdminListShared.module.css';

type StatTone = 'green' | 'red' | 'orange' | 'muted';

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
      <div className={adminStyles.statCardGrid4}>
        <StatCard
          label="Conexión"
          value={isOnline ? 'En Línea' : 'Offline'}
          icon={isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
          tone={isOnline ? 'green' : 'red'}
        />
        <StatCard
          label="Pendientes"
          value={String(stats.pending + stats.syncing)}
          icon={<Clock size={20} />}
          tone="orange"
        />
        <StatCard
          label="Con Errores"
          value={String(stats.failed)}
          icon={<AlertTriangle size={20} />}
          tone={stats.failed > 0 ? 'red' : 'muted'}
        />
        <StatCard
          label="Conflictos"
          value={String(stats.conflict)}
          icon={<AlertTriangle size={20} />}
          tone={stats.conflict > 0 ? 'orange' : 'muted'}
        />
      </div>

      <Section>
        <SyncQueuePanel />
      </Section>
    </PageContainer>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: StatTone }) {
  const iconClass = {
    green: adminStyles.statIconGreen,
    red: adminStyles.statIconRed,
    orange: adminStyles.statIconOrange,
    muted: adminStyles.statIconMuted,
  }[tone];

  const valueClass = {
    green: adminStyles.statValueGreen,
    red: adminStyles.statValueRed,
    orange: adminStyles.statValueOrange,
    muted: adminStyles.statValueMuted,
  }[tone];

  return (
    <div className={adminStyles.statCardLg}>
      <div className={adminStyles.statCardHeader}>
        <p className={adminStyles.statCardLabelSecondary}>{label}</p>
        <div className={iconClass}>{icon}</div>
      </div>
      <h2 className={clsx(adminStyles.statCardValueLg, valueClass)}>{value}</h2>
    </div>
  );
}
