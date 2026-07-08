/**
 * Maps backend ledger movement types to UI direction/labels.
 * Backend stores types like GOODS_RECEIPT, SALE_EXIT, ADJUSTMENT, etc.
 * Legacy UI used ADD / SUBTRACT / SET.
 */

export type MovementDirection = 'IN' | 'OUT' | 'NEUTRAL';

const INBOUND_TYPES = new Set([
  'ADD',
  'GOODS_RECEIPT',
  'SALE_RETURN',
  'RETURN',
  'TRANSFER_IN',
  'RESERVATION_RELEASE',
]);

const OUTBOUND_TYPES = new Set([
  'SUBTRACT',
  'SALE',
  'SALE_EXIT',
  'TRANSFER_OUT',
  'SHRINKAGE',
  'RESERVATION',
  'CONSUME_RESERVATION',
]);

const ADJUSTMENT_TYPES = new Set([
  'SET',
  'ADJUSTMENT',
  'STOCK_TAKE_ADJUSTMENT',
  'POS_CORRECTION',
]);

const LABELS: Record<string, string> = {
  ADD: 'Entrada',
  SUBTRACT: 'Salida',
  SET: 'Ajuste físico',
  GOODS_RECEIPT: 'Recepción de mercadería',
  SALE: 'Venta',
  SALE_EXIT: 'Salida por venta',
  SALE_RETURN: 'Devolución de venta',
  RETURN: 'Devolución',
  TRANSFER_OUT: 'Transferencia (salida)',
  TRANSFER_IN: 'Transferencia (entrada)',
  SHRINKAGE: 'Merma',
  POS_CORRECTION: 'Corrección POS',
  ADJUSTMENT: 'Ajuste manual',
  STOCK_TAKE_ADJUSTMENT: 'Ajuste por auditoría',
  RESERVATION: 'Reserva',
  RESERVATION_RELEASE: 'Liberación de reserva',
  CONSUME_RESERVATION: 'Consumo de reserva',
};

export function getMovementDirection(type: string, sourceWarehouseId?: string | null, destinationWarehouseId?: string | null): MovementDirection {
  if (INBOUND_TYPES.has(type)) return 'IN';
  if (OUTBOUND_TYPES.has(type)) return 'OUT';
  if (ADJUSTMENT_TYPES.has(type)) {
    // For adjustments, infer from warehouse sides when available
    if (sourceWarehouseId && !destinationWarehouseId) return 'OUT';
    if (destinationWarehouseId && !sourceWarehouseId) return 'IN';
    return 'NEUTRAL';
  }
  // Fallback: infer from warehouse sides
  if (destinationWarehouseId && !sourceWarehouseId) return 'IN';
  if (sourceWarehouseId && !destinationWarehouseId) return 'OUT';
  return 'NEUTRAL';
}

export function getMovementLabel(type: string): string {
  return LABELS[type] || type.replace(/_/g, ' ');
}

export function formatMovementQty(type: string, quantity: number, sourceWarehouseId?: string | null, destinationWarehouseId?: string | null): { text: string; direction: MovementDirection } {
  const direction = getMovementDirection(type, sourceWarehouseId, destinationWarehouseId);
  if (direction === 'IN') return { text: `+${quantity}`, direction };
  if (direction === 'OUT') return { text: `-${quantity}`, direction };
  return { text: String(quantity), direction };
}
