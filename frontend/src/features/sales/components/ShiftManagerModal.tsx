import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal, Button } from '@/components/ui';
import { treasuryApi } from '@/api/treasury.api';
import type { CashShift, CashRegister } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  mode: 'OPEN' | 'CLOSE';
  activeShift: CashShift | null;
  cashRegisterId?: string; // Preselected register
  registers?: CashRegister[]; // Available registers to choose from
}

export function ShiftManagerModal({ open, onClose, mode, activeShift, cashRegisterId: initialRegisterId, registers }: Props) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedRegister, setSelectedRegister] = useState<string>(initialRegisterId || '');

  useEffect(() => {
    if (open) {
      setAmount('');
      setNotes('');
    }
  }, [open]);

  const openMutation = useMutation({
    mutationFn: () => treasuryApi.openShift(selectedRegister, parseFloat(amount) || 0),
    onSuccess: () => {
      toast.success('Turno abierto exitosamente');
      queryClient.invalidateQueries({ queryKey: ['shifts', 'active'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Error al abrir caja')
  });

  const closeMutation = useMutation({
    mutationFn: () => treasuryApi.closeShift(activeShift!.id, parseFloat(amount) || 0, notes),
    onSuccess: (res: any) => {
      // res.data or res contains the shift with difference
      const shift = res.data || res;
      if (shift.difference !== 0) {
        const type = shift.difference > 0 ? 'SOBRANTE' : 'FALTANTE';
        toast(`Turno cerrado con ${type} de $${Math.abs(shift.difference)}`, { icon: '⚠️' });
      } else {
        toast.success('Turno cerrado exitosamente (Arqueo Exacto)');
      }
      queryClient.invalidateQueries({ queryKey: ['shifts', 'active'] });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Error al cerrar caja')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === '') return toast.error('Ingresa un monto');
    
    if (mode === 'OPEN') {
      if (!selectedRegister) return toast.error('Selecciona una caja');
      openMutation.mutate();
    } else {
      if (!activeShift) return toast.error('No hay turno activo');
      closeMutation.mutate();
    }
  };

  const isPending = openMutation.isPending || closeMutation.isPending;

  return (
    <Modal open={open} onClose={onClose} title={mode === 'OPEN' ? 'Apertura de Caja' : 'Cierre de Caja (Arqueo Ciego)'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {mode === 'OPEN' && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Para poder facturar en el POS necesitas abrir un turno. Ingresa el <strong>Fondo de Caja</strong> (dinero inicial para cambio).
          </p>
        )}

        {mode === 'CLOSE' && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Cuenta los billetes y monedas en la caja y declara el total. El sistema registrará cualquier diferencia automáticamente.
          </p>
        )}

        {mode === 'OPEN' && registers && registers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Seleccionar Caja</label>
            <select
              value={selectedRegister}
              onChange={e => setSelectedRegister(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px', background: 'var(--bg-base)' }}
            >
              <option value="">-- Cajas Disponibles --</option>
              {registers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>
            {mode === 'OPEN' ? 'Saldo Inicial (Efectivo)' : 'Dinero Físico Contado'}
          </label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '16px', fontWeight: 600 }}
            autoFocus
          />
        </div>

        {mode === 'CLOSE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Notas / Observaciones (Opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Faltan $10 por compra de agua"
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          {mode === 'CLOSE' && (
            <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          )}
          <Button variant="primary" type="submit" loading={isPending}>
            {mode === 'OPEN' ? 'Abrir Turno' : 'Cerrar Turno'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
