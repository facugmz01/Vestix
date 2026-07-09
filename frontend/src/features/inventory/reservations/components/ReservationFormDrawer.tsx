import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { reservationsApi, type CreateReservationDto } from '@/api/reservations.api';
import { customersApi } from '@/api/customers.api';
import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Plus, X, PackageSearch, Clock } from 'lucide-react';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ReservationFormDrawer({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const [branchId, setBranchId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  
  const defaultDate = new Date();
  defaultDate.setHours(defaultDate.getHours() + 24);
  const [expiresAt, setExpiresAt] = useState(defaultDate.toISOString().slice(0, 16));

  const [lines, setLines] = useState<{ variantId: string; variantSku: string; quantity: number }[]>([]);
  const [searchSku, setSearchSku] = useState('');
  const [qtyInput, setQtyInput] = useState(1);

  const { data: branchesData } = useQuery({ queryKey: queryKeys.branches.all(), queryFn: () => branchesApi.getBranches({}), enabled: open });
  const { data: customersData } = useQuery({ queryKey: queryKeys.customers.all(), queryFn: () => customersApi.getCustomers({}), enabled: open });

  useEffect(() => {
    if (open) {
      setBranchId('');
      setCustomerId('');
      setNotes('');
      setLines([]);
    }
  }, [open]);

  const addLine = () => {
    if (!searchSku.trim() || qtyInput <= 0) return;
    setLines([...lines, { variantId: searchSku, variantSku: searchSku, quantity: qtyInput }]);
    setSearchSku('');
    setQtyInput(1);
  };

  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  const mutation = useMutation({
    mutationFn: (data: CreateReservationDto) => reservationsApi.createReservation(data),
    onSuccess: () => {
      toast.success('Reserva creada exitosamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all() });
      onClose();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al crear reserva (¿Hay stock suficiente?)'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) { toast.error('Debe seleccionar la sucursal/depósito'); return; }
    if (lines.length === 0) { toast.error('Agregue al menos un artículo a reservar'); return; }

    mutation.mutate({
      branchId,
      customerId: customerId || undefined,
      expiresAt: new Date(expiresAt).toISOString(),
      notes,
      lines: lines.map(l => ({ variantId: l.variantId, quantity: l.quantity })),
    });
  };

  return (
    <Drawer
      open={open}
      title="Nueva Reserva de Mercadería"
      onClose={onClose}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>Crear Reserva de Stock</Button>
        </>
      }
    >
      <div className={styles.formStackMd}>
        <div className={styles.infoPanelBlue}>
          <p className={styles.infoPanelBlueText}>
            <strong>Aviso:</strong> Reservar stock restará la cantidad disponible para venta al público, pero no lo facturará.
          </p>
        </div>

        <div className="grid-responsive grid-cols-2">
          <div className={styles.fieldGroupSm}>
            <label className={styles.selectLabel}>Sucursal / Depósito *</label>
            <select value={branchId} onChange={e => setBranchId(e.target.value)} className={styles.select}>
              <option value="">Seleccionar Sucursal...</option>
              {branchesData?.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          
          <div className={styles.fieldGroupSm}>
            <label className={styles.selectLabel}>Cliente (Opcional)</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={styles.select}>
              <option value="">A Nombre de...</option>
              {customersData?.data.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.fieldGroupSm}>
          <label className={styles.labelRow}>
            <Clock size={16} /> Fecha/Hora de Vencimiento
          </label>
          <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          <p className={styles.scopeHint}>El stock se liberará automáticamente al cumplirse este plazo si no se concreta la venta.</p>
        </div>

        <div className={styles.sectionPanel}>
          <h4 className={styles.sectionTitleRow}>
            <PackageSearch size={16} /> Artículos a Reservar
          </h4>
          
          <div className={styles.addLineRowEnd}>
            <div className={styles.flex2}><Input label="SKU / ID" value={searchSku} onChange={e => setSearchSku(e.target.value)} /></div>
            <div className={styles.flex1}><Input label="Cant." type="number" min="1" value={qtyInput} onChange={e => setQtyInput(Number(e.target.value))} /></div>
            <Button type="button" variant="ghost" onClick={addLine} className={styles.addLineBtn}><Plus size={16} /></Button>
          </div>

          <div className={styles.lineItemsWrap}>
            <table className={styles.lineItemsTable}>
              <thead>
                <tr className={styles.lineItemsTr}>
                  <th className={styles.lineItemsThCompact}>SKU</th>
                  <th className={styles.lineItemsThCompact}>Cant.</th>
                  <th className={styles.lineItemsThCompact}></th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 && (
                  <tr><td colSpan={3} className={styles.lineItemsEmptyTd}>Sin artículos</td></tr>
                )}
                {lines.map((l, i) => (
                  <tr key={i} className={styles.lineItemsTr}>
                    <td className={styles.lineItemsTdSku}>{l.variantSku}</td>
                    <td className={styles.lineItemsTdCompact}>{l.quantity}</td>
                    <td className={styles.lineItemsTdRight}>
                      <X size={16} color="var(--red)" className={styles.clickable} onClick={() => removeLine(i)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.fieldGroupSm}>
          <label className={styles.selectLabel}>Notas</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={styles.textarea} />
        </div>
      </div>
    </Drawer>
  );
}
