import clsx from 'clsx';
import styles from './StatusChip.module.css';
import type { OrderStatus, POStatus } from '@/types';

type ChipColor = 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gray';

interface Props {
  label:   string;
  color?:  ChipColor;
  dot?:    boolean;
  size?:   'sm' | 'md';
}

/** Generic status chip — compose with the semantic helpers below. */
export function StatusChip({ label, color = 'gray', dot = true, size = 'md' }: Props) {
  return (
    <span className={clsx(styles.chip, styles[color], styles[size])}>
      {dot && <span className={styles.dot} aria-hidden />}
      {label}
    </span>
  );
}

// ─── Semantic helpers ─────────────────────────────────────────────────────────

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: ChipColor }> = {
  PENDING_PAYMENT: { label: 'Pago pendiente',  color: 'yellow' },
  PAID:            { label: 'Pagado',           color: 'blue'   },
  PICKING:         { label: 'En preparación',   color: 'purple' },
  PACKED:          { label: 'Empaquetado',       color: 'purple' },
  SHIPPED:         { label: 'Enviado',           color: 'blue'   },
  DELIVERED:       { label: 'Entregado',         color: 'green'  },
  CANCELLED:       { label: 'Cancelado',         color: 'red'    },
};

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const { label, color } = ORDER_STATUS_MAP[status] ?? { label: status, color: 'gray' as ChipColor };
  return <StatusChip label={label} color={color} />;
}

const PO_STATUS_MAP: Record<POStatus, { label: string; color: ChipColor }> = {
  DRAFT:               { label: 'Borrador',           color: 'gray'   },
  ISSUED:              { label: 'Emitida',             color: 'blue'   },
  PARTIALLY_RECEIVED:  { label: 'Parcialmente recibida', color: 'yellow' },
  COMPLETED:           { label: 'Completada',          color: 'green'  },
  CANCELLED:           { label: 'Cancelada',           color: 'red'    },
};

export function POStatusChip({ status }: { status: POStatus }) {
  const { label, color } = PO_STATUS_MAP[status] ?? { label: status, color: 'gray' as ChipColor };
  return <StatusChip label={label} color={color} />;
}

export function ActiveChip({ active }: { active: boolean }) {
  return <StatusChip label={active ? 'Activo' : 'Inactivo'} color={active ? 'green' : 'gray'} />;
}

export function PublishedChip({ published }: { published: boolean }) {
  return <StatusChip label={published ? 'Publicado' : 'Oculto'} color={published ? 'green' : 'yellow'} />;
}

export function StockStatusChip({ qty, reorderPoint = 5 }: { qty: number; reorderPoint?: number }) {
  if (qty === 0)            return <StatusChip label="Sin stock"    color="red"    />;
  if (qty <= reorderPoint)  return <StatusChip label="Stock bajo"   color="yellow" />;
  return                           <StatusChip label="En stock"     color="green"  />;
}
