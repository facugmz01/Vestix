import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { reservationsApi, type CreateReservationDto } from '@/api/reservations.api';
import { customersApi } from '@/api/customers.api';
import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Plus, X, PackageSearch, Clock } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ReservationFormDrawer({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const [branchId, setBranchId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  
  // Default expiration to 24 hours from now
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
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all() }); // Refresh global stock
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Error al crear reserva (¿Hay stock suficiente?)'),
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ padding: '16px', background: 'var(--blue-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--blue)' }}>
          <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--blue)' }}>
            <strong>Aviso:</strong> Reservar stock restará la cantidad disponible para venta al público, pero no lo facturará.
          </p>
        </div>

        <div className="grid-responsive grid-cols-2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Sucursal / Depósito *</label>
            <select value={branchId} onChange={e => setBranchId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option value="">Seleccionar Sucursal...</option>
              {branchesData?.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Cliente (Opcional)</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option value="">A Nombre de...</option>
              {customersData?.data.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} /> Fecha/Hora de Vencimiento
          </label>
          <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>El stock se liberará automáticamente al cumplirse este plazo si no se concreta la venta.</p>
        </div>

        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackageSearch size={16} /> Artículos a Reservar
          </h4>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}><Input label="SKU / ID" value={searchSku} onChange={e => setSearchSku(e.target.value)} /></div>
            <div style={{ flex: 1 }}><Input label="Cant." type="number" min="1" value={qtyInput} onChange={e => setQtyInput(Number(e.target.value))} /></div>
            <Button type="button" variant="ghost" onClick={addLine} style={{ marginBottom: '2px' }}><Plus size={16} /></Button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px 4px' }}>SKU</th>
                <th style={{ padding: '8px 4px' }}>Cant.</th>
                <th style={{ padding: '8px 4px' }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>Sin artículos</td></tr>}
              {lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 4px', fontWeight: 600, fontFamily: 'monospace' }}>{l.variantSku}</td>
                  <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>{l.quantity}</td>
                  <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                    <X size={16} color="var(--red)" style={{ cursor: 'pointer' }} onClick={() => removeLine(i)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Notas</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }} />
        </div>

      </div>
    </Drawer>
  );
}
