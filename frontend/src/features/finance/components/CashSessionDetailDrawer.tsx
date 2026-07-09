import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table, Input } from '@/components/ui';
import { treasuryApi } from '@/api/treasury.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle, Calculator, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { TreasuryTransactionModal } from './TreasuryTransactionModal';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
}

export function CashSessionDetailDrawer({ open, onClose, shiftId }: Props) {
  const queryClient = useQueryClient();

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [closingAmount, setClosingAmount] = useState(0);

  const { data: shift, isLoading: isShiftLoading } = useQuery({
    queryKey: queryKeys.treasury.shiftDetail(shiftId || ''),
    queryFn: () => treasuryApi.getShift(shiftId!),
    enabled: open && !!shiftId,
  });

  const { data: movements } = useQuery({
    queryKey: queryKeys.treasury.shiftMovements(shiftId || ''),
    queryFn: () => treasuryApi.getShiftMovements(shiftId!),
    enabled: open && !!shiftId,
  });

  const closeMutation = useMutation({
    mutationFn: () => treasuryApi.closeShift(shiftId!, closingAmount),
    onSuccess: () => {
      toast.success('Arqueo de Caja finalizado con éxito.');
      queryClient.invalidateQueries({ queryKey: queryKeys.treasury.shiftDetail(shiftId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.treasury.shifts() });
      setIsClosing(false);
    },
    onError: (err: any) => toast.error(err.message || 'Error al cerrar caja'),
  });

  if (!shiftId || isShiftLoading || !shift) {
    return <Drawer open={open} onClose={onClose} title="Cargando..." width="lg"><div /></Drawer>;
  }

  const diffColor = shift.difference && shift.difference < 0 ? 'var(--red)' : (shift.difference && shift.difference > 0 ? 'var(--orange)' : 'var(--green)');

  return (
    <Drawer open={open} onClose={onClose} title="Auditoría de Turno (Caja)" width="lg">
      <div className={styles.stackMd}>

        <div className={styles.heroCard}>
          <div>
            <Badge color={shift.status === 'OPEN' ? 'green' : 'gray'}>{shift.status === 'OPEN' ? 'TURNO ABIERTO' : 'CERRADO'}</Badge>
            <h3 className={styles.sessionTitle}>{shift.accountName || 'Caja Registradora'}</h3>
            <p className={styles.sessionMeta}>Apertura: {new Date(shift.openedAt).toLocaleString()} por {shift.openedByUserName}</p>
          </div>
          <div className={styles.openingAside}>
            <span className={styles.openingLabel}>Saldo Inicial (Apertura)</span>
            <span className={styles.openingValue}>{formatCurrency(shift.openingBalance)}</span>
          </div>
        </div>

        {shift.status === 'CLOSED' && (
          <div className="grid-responsive grid-cols-3">
            <div className={styles.resultCard}>
              <p className={styles.resultTitle}>Esperado por Sistema</p>
              <h2 className={styles.resultValue}>{formatCurrency(shift.expectedClosingBalance || 0)}</h2>
            </div>
            <div className={styles.resultCard}>
              <p className={styles.resultTitle}>Conteo Físico Real</p>
              <h2 className={styles.resultValue}>{formatCurrency(shift.actualClosingBalance || 0)}</h2>
            </div>
            <div className={styles.diffCard} style={{ borderColor: diffColor, color: diffColor }}>
              <p className={styles.diffTitle}>Diferencia (Faltante/Sobrante)</p>
              <h2 className={styles.diffValue}>
                {shift.difference === 0 ? <CheckCircle /> : <AlertTriangle />}
                {formatCurrency(shift.difference || 0)}
              </h2>
            </div>
          </div>
        )}

        <div className={styles.movementsPanel}>
          <div className={styles.movementsHeader}>
            <h4 className={styles.movementsTitle}><Wallet size={16} /> Movimientos Manuales</h4>
            {shift.status === 'OPEN' && (
              <ActionGuard action="manage" subject="Finance">
                <Button variant="ghost" size="sm" onClick={() => setTransactionModalOpen(true)}>+ Retiro / Ingreso</Button>
              </ActionGuard>
            )}
          </div>

          <Table
            keyField="id"
            data={movements || []}
            columns={[
              { key: 'time', header: 'Hora', render: (m) => <span className={styles.timeCell}>{new Date(m.createdAt).toLocaleTimeString()}</span> },
              {
                key: 'type',
                header: 'Tipo',
                render: (m) => (
                  <Badge color={m.type === 'INCOME' ? 'green' : 'red'}>
                    {m.type === 'INCOME' ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />} {m.type}
                  </Badge>
                )
              },
              { key: 'concept', header: 'Concepto / Justificación', render: (m) => m.concept },
              {
                key: 'amount',
                header: 'Monto',
                render: (m) => (
                  <span className={m.type === 'INCOME' ? styles.amountIncome : styles.amountExpense}>
                    {m.type === 'INCOME' ? '+' : '-'}{formatCurrency(m.amount)}
                  </span>
                )
              }
            ]}
          />
        </div>

        {shift.status === 'OPEN' && (
          <div className={styles.closePanel}>
            {!isClosing ? (
              <div className={styles.closePanelRow}>
                <div>
                  <h4 className={styles.closePanelTitle}>Arqueo y Cierre de Caja</h4>
                  <p className={styles.closePanelText}>Contá el dinero físico y decláralo para calcular diferencias.</p>
                </div>
                <ActionGuard action="manage" subject="Finance">
                  <Button variant="primary" onClick={() => setIsClosing(true)} icon={<Calculator size={16} />}>Iniciar Cierre (Blind Count)</Button>
                </ActionGuard>
              </div>
            ) : (
              <div className={styles.closeForm}>
                <h4 className={styles.closeFormTitle}>Declaración de Conteo (Blind Count)</h4>
                <div className={styles.closeFormRow}>
                  <div className={styles.closeFormInput}>
                    <Input
                      label="Efectivo Total en Cajón ($)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={closingAmount}
                      onChange={e => setClosingAmount(Number(e.target.value))}
                    />
                  </div>
                  <Button variant="ghost" onClick={() => setIsClosing(false)} disabled={closeMutation.isPending}>Cancelar</Button>
                  <Button variant="primary" onClick={() => closeMutation.mutate()} loading={closeMutation.isPending} disabled={closingAmount < 0}>
                    Cerrar Turno Definitivo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <TreasuryTransactionModal
          open={transactionModalOpen}
          onClose={() => setTransactionModalOpen(false)}
          shiftId={shiftId}
        />

      </div>
    </Drawer>
  );
}
