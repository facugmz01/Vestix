import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { purchasesApi, type CreatePurchaseOrderDto } from '@/api/purchases.api';
import { suppliersApi } from '@/api/suppliers.api';
import { apiClient } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { PurchaseOrder } from '@/types';
import toast from 'react-hot-toast';
import { Plus, X, Search, Package } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  orderToEdit?: PurchaseOrder | null;
}

export function PurchaseFormDrawer({ open, onClose, orderToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!orderToEdit;

  const [supplierId, setSupplierId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [lines, setLines] = useState<{ variantId: string; variantSku: string; quantity: number; unitCost: number }[]>([]);

  const [search, setSearch] = useState('');

  const { data: suppliersData } = useQuery({ 
    queryKey: queryKeys.suppliers.all(), 
    queryFn: () => suppliersApi.getSuppliers({}),
    enabled: open
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => apiClient.get('/warehouses').then(res => res.data),
    enabled: open
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['pos-search', search],
    queryFn: () => apiClient.get('/pos/catalog/search', { params: { q: search } }).then(res => res.data),
    enabled: search.length >= 3 && open,
  });

  useEffect(() => {
    if (open && orderToEdit) {
      setSupplierId(orderToEdit.supplierId);
      setDestinationWarehouseId(orderToEdit.destinationWarehouseId || '');
      setExpectedDeliveryDate(orderToEdit.expectedDeliveryDate ? orderToEdit.expectedDeliveryDate.split('T')[0] : '');
      setLines(orderToEdit.lines.map(l => ({
        variantId: l.variantId,
        variantSku: l.variantSku || l.variantId,
        quantity: l.orderedQuantity,
        unitCost: l.unitCost
      })));
    } else if (open && !orderToEdit) {
      setSupplierId('');
      setDestinationWarehouseId('');
      setExpectedDeliveryDate('');
      setLines([]);
      setSearch('');
    }
  }, [open, orderToEdit]);

  const handleAddToCart = (product: any) => {
    const existing = lines.find(l => l.variantId === product.id);
    if (existing) {
      setLines(lines.map(l => l.variantId === product.id ? { ...l, quantity: l.quantity + 1 } : l));
    } else {
      setLines([...lines, { variantId: product.id, variantSku: product.name + (product.size ? ` (${product.size})` : ''), quantity: 1, unitCost: product.costPrice || 0 }]);
    }
    setSearch('');
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLineQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    setLines(lines.map((l, i) => i === idx ? { ...l, quantity: qty } : l));
  };

  const updateLineCost = (idx: number, cost: number) => {
    if (cost < 0) return;
    setLines(lines.map((l, i) => i === idx ? { ...l, unitCost: cost } : l));
  };

  const totals = lines.reduce((acc, line) => acc + (line.quantity * line.unitCost), 0);
  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, expectedDeliveryDate: data.expectedDeliveryDate || undefined };
      if (isEditing && orderToEdit) return purchasesApi.updateOrder(orderToEdit.id, payload);
      return purchasesApi.createOrder(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Orden actualizada (Borrador)' : 'Orden de compra creada');
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() });
      if (isEditing) queryClient.invalidateQueries({ queryKey: queryKeys.purchases.detail(orderToEdit!.id) });
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Error al guardar'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return toast.error('Seleccioná un proveedor');
    if (!destinationWarehouseId) return toast.error('Seleccioná un depósito de destino');
    if (lines.length === 0) return toast.error('Agregá al menos un artículo a la orden');
    
    mutation.mutate({
      supplierId,
      destinationWarehouseId,
      expectedDeliveryDate,
      lines: lines.map(l => ({ variantId: l.variantId, orderedQuantity: l.quantity, unitCost: l.unitCost })),
    });
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra (Borrador)'}
      onClose={onClose}
      width="1100px"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>Guardar Borrador</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '20px', height: '100%' }}>
        
        {/* LEFT PANEL: CATALOG SEARCH */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)', paddingRight: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
            <input 
              type="text"
              placeholder="Buscar catálogo por SKU, nombre o categoría..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '2px solid var(--accent)', fontSize: '15px', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {search.length < 3 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Package size={48} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p>Escribí al menos 3 letras para buscar.</p>
              </div>
            ) : isSearching ? (
              <p>Buscando en catálogo...</p>
            ) : searchResults?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                {searchResults.map((p: any) => (
                  <div key={p.id} onClick={() => handleAddToCart(p)} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{p.sku}</p>
                    <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, minHeight: '34px' }}>{p.name} {p.size && `(${p.size})`}</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--accent)' }}>{fmtCurrency(p.basePrice)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No se encontraron resultados.</p>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: CART & SETUP */}
        <div style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Configuración de OC</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Proveedor *</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} required>
                <option value="">Seleccionar Proveedor...</option>
                {(suppliersData?.data || []).map((s: any) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Destino (Depósito) *</label>
              <select value={destinationWarehouseId} onChange={e => setDestinationWarehouseId(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} required>
                <option value="">Seleccionar Depósito...</option>
                {(warehouses?.data || warehouses || []).map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            
            <Input 
              label="Fecha de Entrega Esperada" 
              type="date" 
              value={expectedDeliveryDate} 
              onChange={e => setExpectedDeliveryDate(e.target.value)} 
            />
          </div>

          <div style={{ flex: 1, background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Artículos Agregados</h3>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lines.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>No hay artículos en la orden.</p>}
              {lines.map((l, i) => (
                <div key={i} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{l.variantSku}</span>
                    <X size={16} color="var(--red)" style={{ cursor: 'pointer' }} onClick={() => removeLine(i)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cant.</label>
                      <input type="number" min="1" value={l.quantity} onChange={(e) => updateLineQty(i, Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Costo U.</label>
                      <input type="number" min="0" step="0.01" value={l.unitCost} onChange={(e) => updateLineCost(i, Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '13px', fontWeight: 800 }}>
                    {fmtCurrency(l.quantity * l.unitCost)}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed var(--border)', textAlign: 'right' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Monto Total OC: </span>
              <span style={{ fontSize: '24px', fontWeight: 900, display: 'block', color: 'var(--text-primary)' }}>{fmtCurrency(totals)}</span>
            </div>
          </div>

        </div>
      </form>
    </Drawer>
  );
}

