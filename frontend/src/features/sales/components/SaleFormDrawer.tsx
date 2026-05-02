import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { salesApi, type CreateSaleDto } from '@/api/sales.api';
import { customersApi } from '@/api/customers.api';
import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';
import { Plus, X, Calculator, Percent } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SaleFormDrawer({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const [branchId, setBranchId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<CreateSaleDto['paymentMethod']>('CASH');
  
  const [lines, setLines] = useState<{ variantId: string; variantSku: string; quantity: number; basePrice: number; discountPct: number }[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);

  const [searchSku, setSearchSku] = useState('');
  const [qtyInput, setQtyInput] = useState(1);
  const [priceInput, setPriceInput] = useState(0);

  const { data: branchesData } = useQuery({ queryKey: queryKeys.branches.all(), queryFn: () => branchesApi.getBranches({}), enabled: open });
  const { data: customersData } = useQuery({ queryKey: queryKeys.customers.all(), queryFn: () => customersApi.getCustomers({}), enabled: open });

  useEffect(() => {
    if (open) {
      setBranchId('');
      setCustomerId('');
      setLines([]);
      setGlobalDiscount(0);
      setPaymentMethod('CASH');
    }
  }, [open]);

  const addLine = () => {
    if (!searchSku.trim() || qtyInput <= 0 || priceInput < 0) return;
    setLines([...lines, { variantId: searchSku, variantSku: searchSku, quantity: qtyInput, basePrice: priceInput, discountPct: 0 }]);
    setSearchSku('');
    setQtyInput(1);
    setPriceInput(0);
  };

  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));
  const updateLineDiscount = (idx: number, pct: number) => {
    const newLines = [...lines];
    newLines[idx].discountPct = Math.max(0, Math.min(100, pct));
    setLines(newLines);
  };

  const subtotal = lines.reduce((acc, line) => acc + (line.basePrice * line.quantity), 0);
  const lineDiscountsTotal = lines.reduce((acc, line) => acc + ((line.basePrice * line.quantity) * (line.discountPct / 100)), 0);
  const totalAfterLines = subtotal - lineDiscountsTotal;
  const cartDiscountAmt = totalAfterLines * (globalDiscount / 100);
  const grandTotal = totalAfterLines - cartDiscountAmt;

  const mutation = useMutation({
    mutationFn: (data: { status: 'QUOTATION'|'CONFIRMED' }) => {
      const payload: CreateSaleDto = {
        branchId,
        customerId: customerId || undefined,
        source: 'BACKOFFICE',
        paymentMethod,
        status: data.status,
        cartDiscountTotal: cartDiscountAmt,
        lines: lines.map(l => ({
          variantId: l.variantId,
          quantity: l.quantity,
          basePrice: l.basePrice,
          discountAmount: (l.basePrice * l.quantity) * (l.discountPct / 100),
        })),
      };
      return salesApi.createSale(payload);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'QUOTATION' ? 'Presupuesto creado con éxito' : 'Venta Confirmada');
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all() });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Error al procesar la operación'),
  });

  const handleSave = (status: 'QUOTATION' | 'CONFIRMED') => {
    if (!branchId) { toast.error('Debe seleccionar una sucursal origen'); return; }
    if (lines.length === 0) { toast.error('Agregue al menos un artículo'); return; }
    mutation.mutate({ status });
  };

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <Drawer
      open={open}
      title="Nueva Venta / Presupuesto"
      onClose={onClose}
      width="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="secondary" onClick={() => handleSave('QUOTATION')} loading={mutation.isPending}>Guardar como Presupuesto</Button>
            <Button variant="primary" onClick={() => handleSave('CONFIRMED')} loading={mutation.isPending}>Confirmar Venta</Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Cabecera */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Sucursal Emisora *</label>
            <select value={branchId} onChange={e => setBranchId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option value="">Seleccionar Sucursal...</option>
              {branchesData?.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Cliente (Opcional)</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option value="">Consumidor Final</option>
              {customersData?.data.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Forma de Pago</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <option value="CASH">Efectivo</option>
              <option value="CREDIT_CARD">Tarjeta (Débito/Crédito)</option>
              <option value="BANK_TRANSFER">Transferencia</option>
              <option value="CUSTOMER_CREDIT">Cuenta Corriente</option>
            </select>
          </div>
        </div>

        {/* Carga de Artículos */}
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><Calculator size={16} /> Detalle del Carrito</h4>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: 2 }}><Input label="SKU / ID" value={searchSku} onChange={e => setSearchSku(e.target.value)} /></div>
            <div style={{ flex: 1 }}><Input label="Cant." type="number" min="1" value={qtyInput} onChange={e => setQtyInput(Number(e.target.value))} /></div>
            <div style={{ flex: 1 }}><Input label="Precio U. ($)" type="number" min="0" step="0.01" value={priceInput} onChange={e => setPriceInput(Number(e.target.value))} /></div>
            <Button type="button" variant="outline" onClick={addLine} style={{ marginBottom: '2px' }}><Plus size={16} /></Button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px 4px' }}>SKU</th>
                <th style={{ padding: '8px 4px' }}>Precio U.</th>
                <th style={{ padding: '8px 4px' }}>Cant.</th>
                <th style={{ padding: '8px 4px' }}>Desc. %</th>
                <th style={{ padding: '8px 4px' }}>Total L.</th>
                <th style={{ padding: '8px 4px' }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>Carrito vacío</td></tr>}
              {lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 4px', fontWeight: 600, fontFamily: 'monospace' }}>{l.variantSku}</td>
                  <td style={{ padding: '8px 4px' }}>{fmtCurrency(l.basePrice)}</td>
                  <td style={{ padding: '8px 4px' }}>{l.quantity}</td>
                  <td style={{ padding: '8px 4px' }}>
                    <input 
                      type="number" 
                      min="0" max="100" 
                      value={l.discountPct} 
                      onChange={e => updateLineDiscount(i, Number(e.target.value))} 
                      style={{ width: '60px', padding: '4px', border: '1px solid var(--border)' }}
                    />
                  </td>
                  <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>
                    {fmtCurrency((l.basePrice * l.quantity) * (1 - (l.discountPct / 100)))}
                  </td>
                  <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                    <X size={16} color="var(--red)" style={{ cursor: 'pointer' }} onClick={() => removeLine(i)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumen de Totales */}
        <div style={{ marginLeft: 'auto', width: '350px', padding: '20px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span>Subtotal Bruto:</span>
            <span>{fmtCurrency(subtotal)}</span>
          </div>
          {lineDiscountsTotal > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--red)' }}>
              <span>Descuentos por Línea:</span>
              <span>- {fmtCurrency(lineDiscountsTotal)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Percent size={14} /> Descuento Global (%):</span>
            <input 
              type="number" 
              min="0" max="100" 
              value={globalDiscount} 
              onChange={e => setGlobalDiscount(Number(e.target.value))} 
              style={{ width: '60px', padding: '4px', textAlign: 'right', border: '1px solid var(--border)' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 900, marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <span>Total Neto:</span>
            <span>{fmtCurrency(grandTotal)}</span>
          </div>
        </div>

      </div>
    </Drawer>
  );
}
