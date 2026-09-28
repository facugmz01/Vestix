import React from 'react';
import clsx from 'clsx';
import {
  FileText,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Activity,
} from 'lucide-react';
import styles from './OrderLifecycleTimeline.module.css';

export interface OrderLifecycleTimelineProps {
  status: string;
  createdAt?: string | Date;
}

interface StepConfig {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  statuses: string[];
}

const LIFECYCLE_STEPS: StepConfig[] = [
  {
    id: 1,
    label: 'Cotización / Borrador',
    sublabel: 'Presupuesto',
    icon: FileText,
    statuses: ['QUOTATION', 'QUOTE', 'DRAFT'],
  },
  {
    id: 2,
    label: 'Pendiente de Pago',
    sublabel: 'Esperando pago',
    icon: Clock,
    statuses: ['PENDING_PAYMENT', 'PAYMENT_PENDING'],
  },
  {
    id: 3,
    label: 'Confirmado / Pagado',
    sublabel: 'Aprobado',
    icon: CheckCircle2,
    statuses: ['CONFIRMED', 'COMPLETED', 'PAID'],
  },
  {
    id: 4,
    label: 'En Preparación / Tránsito',
    sublabel: 'En camino',
    icon: Truck,
    statuses: ['READY_FOR_PICKUP', 'SHIPPED', 'PROCESSING', 'IN_TRANSIT'],
  },
  {
    id: 5,
    label: 'Entregado',
    sublabel: 'Finalizado',
    icon: PackageCheck,
    statuses: ['DELIVERED'],
  },
];

function resolveStepIndex(status: string): number {
  const norm = (status || '').toUpperCase();
  if (['QUOTATION', 'QUOTE', 'DRAFT'].includes(norm)) return 1;
  if (['PENDING_PAYMENT', 'PAYMENT_PENDING'].includes(norm)) return 2;
  if (['CONFIRMED', 'COMPLETED', 'PAID'].includes(norm)) return 3;
  if (['READY_FOR_PICKUP', 'SHIPPED', 'PROCESSING', 'IN_TRANSIT'].includes(norm)) return 4;
  if (['DELIVERED'].includes(norm)) return 5;
  return 3;
}

export function OrderLifecycleTimeline({ status, createdAt }: OrderLifecycleTimelineProps) {
  const isCancelled = status?.toUpperCase() === 'CANCELLED';
  const currentStepIndex = resolveStepIndex(status);

  // If order was already delivered, all 5 steps are 100% completed
  const progressPercent = isCancelled
    ? 0
    : currentStepIndex === 1
    ? 0
    : Math.min(100, Math.round(((currentStepIndex - 1) / (LIFECYCLE_STEPS.length - 1)) * 100));

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <span className={styles.timelineTitle}>
          <Activity size={14} /> Ciclo de Vida del Pedido
        </span>
        {formattedDate && <span className={styles.timestamp}>{formattedDate}</span>}
      </div>

      {isCancelled ? (
        <div className={styles.cancelledBanner}>
          <XCircle size={22} className={styles.cancelledIcon} />
          <div>
            <div>Documento Cancelado / Anulado</div>
            <div style={{ fontSize: '12px', fontWeight: 400, opacity: 0.9, marginTop: '2px' }}>
              Este pedido fue cancelado y no continuará su flujo logístico habitual.
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.timeline} aria-label="Línea de tiempo de la orden">
          {/* Animated Connecting Track */}
          <div className={styles.connectingLineTrack}>
            <div
              className={styles.connectingLineProgress}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {LIFECYCLE_STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStepIndex > step.id || (currentStepIndex === 5 && step.id === 5);
            const isActive = currentStepIndex === step.id && currentStepIndex !== 5;
            const isUpcoming = currentStepIndex < step.id;

            return (
              <div key={step.id} className={styles.stepWrapper}>
                <div
                  className={clsx(
                    styles.stepIconNode,
                    isCompleted && styles.stepIconNodeCompleted,
                    isActive && styles.stepIconNodeActive,
                    isUpcoming && styles.stepIconNodeUpcoming
                  )}
                  title={`${step.label} (${isCompleted ? 'Completado' : isActive ? 'Actual' : 'Próximo'})`}
                >
                  <Icon size={17} />
                </div>

                <div className={styles.stepContent}>
                  <span
                    className={clsx(
                      styles.stepLabel,
                      isActive && styles.stepLabelActive,
                      isCompleted && styles.stepLabelCompleted
                    )}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className={clsx(styles.stepBadge, styles.badgeActive)}>
                      Actual
                    </span>
                  )}
                  {isCompleted && (
                    <span className={clsx(styles.stepBadge, styles.badgeCompleted)}>
                      Listo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderLifecycleTimeline;
