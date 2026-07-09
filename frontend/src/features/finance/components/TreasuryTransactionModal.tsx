import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { treasuryApi } from '@/api/treasury.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  shiftId: string | null;
}

export function TreasuryTransactionModal({ open, onClose, shiftId }: Props) {
  const queryClient = useQueryClient();

  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState<number>(0);
  const [concept, setConcept] = useState('');

  const mutation = useMutation({
    mutationFn: () => treasuryApi.addManualMovement(shiftId!, { type, amount, concept }),
    onSuccess: () => {
      toast.success(type === 'INCOME' ? 'Ingreso registrado' : 'Retiro / Gasto registrado');
      queryClient.invalidateQueries({ queryKey: queryKeys.treasury.shiftDetail(shiftId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.treasury.shiftMovements(shiftId!) });
      onClose();
      setAmount(0);
      setConcept('');
    },
    onError: (err: any) => toast.error(err.message || 'Error al procesar la transacción'),
  });

  const handleSubmit = () => {
    if (amount <= 0) { toast.error('El monto debe ser mayor a 0'); return; }
    if (!concept.trim()) { toast.error('Debe ingresar un concepto'); return; }
    mutation.mutate();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Nuevo Movimiento Manual" width="sm">
      <div className={styles.stackMd}>

        <div className={styles.typeToggleGroup}>
          <label className={styles.typeToggleLabel}>Tipo de Movimiento</label>
          <div className="grid-responsive grid-cols-2">
            <Button variant={type === 'EXPENSE' ? 'primary' : 'outline'} onClick={() => setType('EXPENSE')} icon={<ArrowUpRight size={18} color={type === 'EXPENSE' ? 'var(--text-inverted, #fff)' : 'var(--red)'} />}>
              Retiro / Gasto
            </Button>
            <Button variant={type === 'INCOME' ? 'primary' : 'outline'} onClick={() => setType('INCOME')} icon={<ArrowDownRight size={18} color={type === 'INCOME' ? 'var(--text-inverted, #fff)' : 'var(--green)'} />}>
              Ingreso Extra
            </Button>
          </div>
        </div>

        <Input
          label="Monto ($)"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
        />

        <div className={styles.textareaGroup}>
          <label className={styles.textareaLabel}>Concepto / Justificación</label>
          <textarea
            value={concept}
            onChange={e => setConcept(e.target.value)}
            rows={3}
            placeholder="Ej: Pago a proveedor de limpieza, Flete, etc."
            className={styles.textarea}
          />
        </div>

        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={mutation.isPending}
          className={styles.submitBtn}
        >
          Guardar Movimiento
        </Button>

      </div>
    </Drawer>
  );
}
