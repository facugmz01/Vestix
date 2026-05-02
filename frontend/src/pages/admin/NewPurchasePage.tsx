import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Truck, CreditCard, Trash2, Plus, Minus, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

import { purchasingApi } from '@/api/purchasing.api';
import { queryKeys } from '@/api/queryKeys';
import { erpApi } from '@/api/axios.config';
import type { Supplier, ProductVariant } from '@/types';
import { Button, Input, Badge, Drawer } from '@/components/ui';

export default function NewPurchasePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Data Fetching
  const { data: suppliers } = useQuery({
    queryKey: queryKeys.suppliers.all(),
    queryFn: () => purchasingApi.getSuppliers(),
  });

  const { data: accounts } = useQuery({
    queryKey: ['treasury', 'accounts'],
    queryFn: () => erpApi.get('/finance/treasury/accounts').then(res => res.data),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => erpApi.get('/warehouses').then(res => res.data),
  });

  // 2. State
  const [search, setSearch] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [cart, setCart] = useState<{ variant: ProductVariant, qty: number, cost: number, discount: number }[]>([]);
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['catalog', 'search', search],
    queryFn: () => purchasingApi.searchCatalog(search),
    enabled: search.length >= 3,
  });

  // 3. Logic
  const handleAddToCart = (variant: ProductVariant) => {
    setCart(prev => {
      const exists = prev.find(i => i.variant.id === variant.id);
      if (exists) {
        return prev.map(i => i.variant.id === variant.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { variant, qty: 1, cost: variant.basePrice, discount: 0 }];
    });
    setSearch('');
    searchInputRef.current?.focus();
  };

  const updateLine = (id: string, field: 'qty' | 'cost' | 'discount', value: number) => {
    setCart(prev => prev.map(i => {
      if (i.variant.id === id) {
        return { ...i, [field]: value };
      }
      return i;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.cost * item.qty), 0);
  const totalDiscount = cart.reduce((acc, item) => acc + (item.discount || 0), 0);
  const total = subtotal - totalDiscount;

  const purchaseMutation = useMutation({
    mutationFn: (data: any) => purchasingApi.processDirect(data),
    onSuccess: () => {
      toast.success('Compra registrada correctamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
      navigate('/admin/purchasing');
    },
    onError: (err: any) => toast.error(err.message || 'Error al procesar compra'),
  });

  const handleSave = () => {
    if (!selectedSupplierId) return toast.error('Seleccioná un proveedor');
    if (!selectedWarehouseId) return toast.error('Seleccioná un depósito');
    if (cart.length === 0) return toast.error('El carrito está vacío');
    setPaymentModalOpen(true);
    setPaymentAmount(total);
  };

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: 'var(--bg-elevated)', position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0, zIndex: 100 }}>
      
      {/* HEADER BAR */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}><ArrowLeft /></button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Nueva Compra de Mercadería</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button variant="primary" icon={<Save size={18} />} onClick={handleSave}>Procesar Compra</Button>
        </div>
      </div>

      <div style={{ display: 'flex', width: '100%', marginTop: '60px' }}>
        {/* LEFT: Product Search */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
          <div style={{ padding: '24px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Buscar productos en el catálogo por nombre, SKU o código..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '2px solid var(--accent)', fontSize: '16px', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {search.length < 3 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
                <div>
                  <Truck size={64} style={{ opacity: 0.1, marginBottom: '16px' }} />
                  <p>Buscá los artículos que recibiste para agregarlos a la compra.</p>
                </div>
              </div>
            ) : isSearching ? (
              <div>Cargando catálogo...</div>
            ) : searchResults?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {searchResults.map(p => (
                  <div key={p.id} onClick={() => handleAddToCart(p)} style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{p.sku}</p>
                    <p style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 700, minHeight: '40px' }}>{p.name} {p.size && `(${p.size})`}</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--accent)' }}>{fmtCurrency(p.basePrice)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No se encontraron productos.</p>
            )}
          </div>
        </div>

        {/* RIGHT: Purchase Setup & Cart */}
        <div style={{ width: '450px', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', boxShadow: '-5px 0 15px rgba(0,0,0,0.05)' }}>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Proveedor</label>
              <select 
                value={selectedSupplierId} 
                onChange={e => setSelectedSupplierId(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              >
                <option value="">-- Seleccionar Proveedor --</option>
                {suppliers?.data.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Destino (Depósito)</label>
              <select 
                value={selectedWarehouseId} 
                onChange={e => setSelectedWarehouseId(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              >
                <option value="">-- Seleccionar Depósito --</option>
                {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <ShoppingCart size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>Carrito de compra vacío</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.variant.id} style={{ padding: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700 }}>{item.variant.sku}</span>
                    <Trash2 size={16} color="var(--red)" style={{ cursor: 'pointer' }} onClick={() => setCart(c => c.filter(i => i.variant.id !== item.variant.id))} />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Cantidad</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <Button variant="secondary" size="sm" onClick={() => updateLine(item.variant.id, 'qty', Math.max(1, item.qty - 1))}><Minus size={12}/></Button>
                        <span style={{ width: '30px', textAlign: 'center', fontWeight: 700 }}>{item.qty}</span>
                        <Button variant="secondary" size="sm" onClick={() => updateLine(item.variant.id, 'qty', item.qty + 1)}><Plus size={12}/></Button>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Costo Unitario ($)</label>
                      <input 
                        type="number" 
                        value={item.cost} 
                        onChange={e => updateLine(item.variant.id, 'cost', Number(e.target.value))}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border)', marginTop: '4px', fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600 }}>Desc. ($)</label>
                      <input 
                        type="number" 
                        value={item.discount} 
                        onChange={e => updateLine(item.variant.id, 'discount', Number(e.target.value))}
                        style={{ width: '70px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}
                      />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '16px' }}>{fmtCurrency((item.cost * item.qty) - item.discount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* TOTALS */}
          <div style={{ padding: '24px', background: 'var(--bg-elevated)', borderTop: '2px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{fmtCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--red)' }}>
              <span>Descuentos</span>
              <span>- {fmtCurrency(totalDiscount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 800 }}>Total Compra</span>
              <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--accent)' }}>{fmtCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Drawer open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Confirmar Compra y Pago" width="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 8px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Facturado</p>
            <h1 style={{ margin: 0, fontSize: '42px', color: 'var(--text-primary)' }}>{fmtCurrency(total)}</h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600 }}>Cuenta de Origen (Pago)</label>
            <select 
              value={paymentAccountId} 
              onChange={e => setPaymentAccountId(e.target.value)}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              <option value="">-- No pagar ahora (Deuda) --</option>
              {accounts?.map(a => <option key={a.id} value={a.id}>{a.name} ({fmtCurrency(a.balance)})</option>)}
            </select>
          </div>

          {paymentAccountId && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>Monto a Pagar ($)</label>
              <Input 
                type="number" 
                max={total}
                value={paymentAmount} 
                onChange={e => setPaymentAmount(Number(e.target.value))} 
                style={{ fontSize: '24px', padding: '12px' }}
              />
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Si pagás menos del total, la diferencia se cargará como deuda al proveedor.
              </p>
            </div>
          )}

          {!paymentAccountId && (
            <div style={{ padding: '16px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: '8px', fontSize: '14px' }}>
              <strong>Atención:</strong> Se generará una deuda de <strong>{fmtCurrency(total)}</strong> con el proveedor.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600 }}>Observaciones</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Factura A nro 0001-..."
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', height: '80px', background: 'var(--bg-elevated)' }}
            />
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
            <Button 
              variant="primary" 
              style={{ width: '100%', height: '56px', fontSize: '18px' }}
              loading={purchaseMutation.isPending}
              onClick={() => purchaseMutation.mutate({
                supplierId: selectedSupplierId,
                warehouseId: selectedWarehouseId,
                branchId: 'main', // Hardcoded for now, should be from context
                paymentAccountId,
                paymentAmount,
                notes,
                lines: cart.map(i => ({
                  variantId: i.variant.id,
                  quantity: i.qty,
                  unitCost: i.cost,
                  discountAmount: i.discount
                }))
              })}
            >
              Confirmar Ingreso de Mercadería
            </Button>
          </div>

        </div>
      </Drawer>

    </div>
  );
}
