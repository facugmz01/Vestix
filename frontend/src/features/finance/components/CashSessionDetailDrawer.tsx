import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Badge, Table, Input } from '@/components/ui';
import { treasuryApi } from '@/api/treasury.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Wallet, CheckCircle, Calculator, AlertTriangle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ActionGuard } from '@/rbac/ActionGuard';
import { TreasuryTransactionModal } from './TreasuryTransactionModal';

interface Props {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
}

export function CashSessionDetailDrawer({ open, onClose, shiftId }: Props) {
  const queryClient = useQueryClient();

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  
  // Close Shift Form State
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

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const diffColor = shift.difference && shift.difference < 0 ? 'var(--red)' : (shift.difference && shift.difference > 0 ? 'var(--orange)' : 'var(--green)');

  return (
    <Drawer open={open} onClose={onClose} title="Auditoría de Turno (Caja)" width="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <div>
            <Badge color={shift.status === 'OPEN' ? 'green' : 'gray'}>{shift.status === 'OPEN' ? 'TURNO ABIERTO' : 'CERRADO'}</Badge>
            <h3 style={{ margin: '8px 0 4px', fontSize: '18px', fontWeight: 800 }}>{shift.accountName || 'Caja Registradora'}</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Apertura: {new Date(shift.openedAt).toLocaleString()} por {shift.openedByUserName}</p>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Saldo Inicial (Apertura)</span>
            <span style={{ fontSize: '20px', fontWeight: 900 }}>{fmtCurrency(shift.openingBalance)}</span>
          </div>
        </div>

        {/* RESULTS GRID */}
        {shift.status === 'CLOSED' && (
          <div className="grid-responsive grid-cols-3">
            <div style={{ padding: '16px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-secondary)' }}>Esperado por Sistema</p>
              <h2 style={{ margin: 0, fontSize: '24px' }}>{fmtCurrency(shift.expectedClosingBalance || 0)}</h2>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'var(--text-secondary)' }}>Conteo Físico Real</p>
              <h2 style={{ margin: 0, fontSize: '24px' }}>{fmtCurrency(shift.actualClosingBalance || 0)}</h2>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-base)', border: `2px solid ${diffColor}`, borderRadius: '8px', color: diffColor }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'inherit' }}>Diferencia (Faltante/Sobrante)</p>
              <h2 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {shift.difference === 0 ? <CheckCircle /> : <AlertTriangle />}
                {fmtCurrency(shift.difference || 0)}
              </h2>
            </div>
          </div>
        )}

        {/* MOVEMENTS */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={16} /> Movimientos Manuales</h4>
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
              { key: 'time', header: 'Hora', render: (m) => <span style={{ fontSize: '13px' }}>{new Date(m.createdAt).toLocaleTimeString()}</span> },
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
                  <span style={{ fontWeight: 800, color: m.type === 'INCOME' ? 'var(--green)' : 'var(--red)' }}>
                    {m.type === 'INCOME' ? '+' : '-'}{fmtCurrency(m.amount)}
                  </span>
                )
              }
            ]}
          />
        </div>

        {/* CLOSE SHIFT FORM */}
        {shift.status === 'OPEN' && (
          <div style={{ padding: '20px', background: 'var(--blue-bg)', border: '1px solid var(--blue)', borderRadius: '8px' }}>
            {!isClosing ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', color: 'var(--blue)' }}>Arqueo y Cierre de Caja</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Contá el dinero físico y decláralo para calcular diferencias.</p>
                </div>
                <ActionGuard action="manage" subject="Finance">
                  <Button variant="primary" onClick={() => setIsClosing(true)} icon={<Calculator size={16} />}>Iniciar Cierre (Blind Count)</Button>
                </ActionGuard>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ margin: 0, color: 'var(--blue)' }}>Declaración de Conteo (Blind Count)</h4>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
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
