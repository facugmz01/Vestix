import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Monitor, Search, Trash2, ShoppingCart, User, Plus, Minus, CreditCard, Banknote, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

import { posApi } from '@/api/pos.api';
import { salesApi } from '@/api/sales.api';
import { customersApi } from '@/api/customers.api';
import { get } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { CashRegister, ProductVariant, Customer } from '@/types';

import { Button, Input, Badge, Drawer } from '@/components/ui';

// Subcomponents
function SessionModal({ 
  open, session, availableRegisters, onOpenSession, isPending 
}: { 
  open: boolean, session: CashRegister | null, availableRegisters: CashRegister[], onOpenSession: (id: string, amt: number) => void, isPending: boolean 
}) {
  const [selectedReg, setSelectedReg] = useState('');
  const [amount, setAmount] = useState(0);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-base)', padding: '32px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <h2 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Monitor /> Apertura de Caja</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
          Para comenzar a operar, debés abrir una caja registradora asignando el saldo inicial de efectivo.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Seleccionar Caja</label>
            <select value={selectedReg} onChange={e => setSelectedReg(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <option value="">-- Cajas Disponibles --</option>
              {availableRegisters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          
          <Input 
            label="Fondo de Caja (Efectivo Inicial)" 
            type="number" 
            min="0" 
            value={amount} 
            onChange={e => setAmount(Number(e.target.value))} 
          />

          <Button 
            variant="primary" 
            style={{ marginTop: '16px', height: '44px' }} 
            disabled={!selectedReg || isPending}
            loading={isPending}
            onClick={() => onOpenSession(selectedReg, amount)}
          >
            Abrir Turno
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function POSPage() {
  const queryClient = useQueryClient();
  
  // 1. Session Management
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: queryKeys.pos.session(),
    queryFn: () => posApi.getMyRegister(),
  });

  const { data: registersData } = useQuery({
    queryKey: queryKeys.pos.registers('current-branch'), // Usually derived from auth
    queryFn: () => posApi.getAvailableRegisters('current-branch'),
    enabled: !isSessionLoading && !session, // Only load if no active session
  });

  const openSessionMutation = useMutation({
    mutationFn: (data: { id: string, amt: number }) => posApi.openSession({ cashRegisterId: data.id, openingAmount: data.amt }),
    onSuccess: () => {
      toast.success('Caja abierta correctamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.session() });
    },
    onError: (err: any) => toast.error(err.message || 'Error al abrir caja'),
  });

  // 2. POS State
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [cart, setCart] = useState<{ variant: ProductVariant, qty: number, discountPct: number }[]>([]);
  const [cartDiscountPct, setCartDiscountPct] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH'|'CREDIT_CARD'|'CUSTOMER_CREDIT'|'BANK_TRANSFER'>('CASH');
  const [amountTendered, setAmountTendered] = useState<number>(0);

  // Focus search on mount
  useEffect(() => {
    if (session && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [session]);

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['pos', 'search', search],
    queryFn: () => posApi.searchProduct(search),
    enabled: search.length >= 3,
  });

  const { data: customersData } = useQuery({
    queryKey: queryKeys.customers.all(),
    queryFn: () => customersApi.getCustomers({}),
  });

  // Derived Totals (If frontend does simple math, or we call `posApi.calculateCart`. Doing simple math for speed)
  const subtotal = cart.reduce((acc, item) => acc + (item.variant.basePrice * item.qty), 0);
  const lineDiscounts = cart.reduce((acc, item) => acc + ((item.variant.basePrice * item.qty) * (item.discountPct / 100)), 0);
  const totalAfterLines = subtotal - lineDiscounts;
  const globalDiscount = totalAfterLines * (cartDiscountPct / 100);
  const grandTotal = totalAfterLines - globalDiscount;

  const handleAddToCart = (variant: ProductVariant) => {
    setCart(prev => {
      const exists = prev.find(i => i.variant.id === variant.id);
      if (exists) {
        return prev.map(i => i.variant.id === variant.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { variant, qty: 1, discountPct: 0 }];
    });
    setSearch('');
    searchInputRef.current?.focus();
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.variant.id === id) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const removeLine = (id: string) => {
    setCart(prev => prev.filter(i => i.variant.id !== id));
  };

  const checkoutMutation = useMutation({
    mutationFn: async (status: 'COMPLETED' | 'QUOTE' = 'COMPLETED') => {
      if (!session) throw new Error('No hay sesión de caja activa');

      // Find a valid warehouse for this branch
      const warehouses = await queryClient.fetchQuery({
        queryKey: ['warehouses', session.branchId],
        queryFn: () => get<any[]>('/inventory/warehouses', { params: { branchId: session.branchId } })
      });
      const warehouseId = warehouses?.[0]?.id || 'main';

      // Find a valid financial account for this branch
      const accounts = await queryClient.fetchQuery({
        queryKey: ['accounts', session.branchId],
        queryFn: () => get<any[]>('/finance/accounts', { params: { branchId: session.branchId } })
      });
      const paymentAccountId = accounts?.find(a => a.isActive)?.id;

      if (status === 'COMPLETED' && !paymentAccountId && paymentMethod !== 'CUSTOMER_CREDIT') {
        throw new Error('No se encontró una cuenta de tesorería para registrar el pago');
      }

      return salesApi.createSale({
        id: crypto.randomUUID(),
        branchId: session.branchId,
        warehouseId,
        customerId: selectedCustomerId || undefined,
        source: 'POS',
        paymentMethod,
        paymentAccountId,
        status,
        posGrandTotal: grandTotal,
        createdAtIso: new Date().toISOString(),
        lines: cart.map(i => ({
          variantId: i.variant.id,
          categoryId: (i.variant as any).product?.categoryId || 'default',
          quantity: i.qty,
          unitPriceOverride: i.variant.basePrice,
          discountPct: i.discountPct
        }))
      });
    },
    onSuccess: (_, status) => {
      toast.success(status === 'QUOTE' ? 'Presupuesto guardado' : 'Venta registrada con éxito');
      setCart([]);
      setCartDiscountPct(0);
      setSelectedCustomerId('');
      setPaymentModalOpen(false);
      setAmountTendered(0);
    },
    onError: (err: any) => toast.error(err.message || 'Error al procesar la operación'),
  });

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setPaymentModalOpen(true);
    setAmountTendered(grandTotal);
  };

  const handleSaveQuote = () => {
    if (cart.length === 0) return;
    checkoutMutation.mutate('QUOTE');
  };

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  if (isSessionLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando terminal POS...</div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', margin: '-24px', background: 'var(--bg-elevated)' }}>
      
      {/* Session Blocker */}
      <SessionModal 
        open={!session} 
        session={session} 
        availableRegisters={registersData || []} 
        onOpenSession={(id, amt) => openSessionMutation.mutate({ id, amt })} 
        isPending={openSessionMutation.isPending}
      />

      {/* LEFT: Search & Products */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div style={{ padding: '16px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Escanear Código de Barras o Buscar SKU/Nombre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '2px solid var(--accent)', fontSize: '16px', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          {search.length < 3 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <Monitor size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p>Escaneá un artículo para agregarlo automáticamente al carrito.</p>
              </div>
            </div>
          ) : isSearching ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Buscando...</div>
          ) : searchResults && searchResults.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {searchResults.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => handleAddToCart(p)}
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.2 }}>{p.size ? `Var: ${p.size}` : 'Producto'}</span>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent)', marginTop: 'auto' }}>{fmtCurrency(p.basePrice)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--red)' }}>No se encontraron resultados para "{search}".</div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div style={{ width: '400px', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
        
        {/* Customer Selector */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <User size={20} color="var(--text-muted)" />
          <select 
            value={selectedCustomerId} 
            onChange={e => setSelectedCustomerId(e.target.value)}
            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
          >
            <option value="">Consumidor Final</option>
            {customersData?.data.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </select>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {cart.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', opacity: 0.5 }}>
              <ShoppingCart size={48} style={{ marginBottom: '16px' }} />
              <p>Carrito vacío</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cart.map(item => (
                <div key={item.variant.id} style={{ padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.variant.sku}</span>
                    <Trash2 size={16} color="var(--red)" style={{ cursor: 'pointer' }} onClick={() => removeLine(item.variant.id)} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-base)', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                      <div onClick={() => updateQty(item.variant.id, -1)} style={{ cursor: 'pointer', padding: '4px' }}><Minus size={14} /></div>
                      <span style={{ fontWeight: 800, width: '20px', textAlign: 'center' }}>{item.qty}</span>
                      <div onClick={() => updateQty(item.variant.id, 1)} style={{ cursor: 'pointer', padding: '4px' }}><Plus size={14} /></div>
                    </div>
                    
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Precio Unit.</p>
                      <input 
                        type="number" 
                        value={item.variant.basePrice} 
                        onChange={e => {
                          const newPrice = Number(e.target.value);
                          setCart(prev => prev.map(i => i.variant.id === item.variant.id ? { ...i, variant: { ...i.variant, basePrice: newPrice } } : i));
                        }}
                        style={{ width: '90px', padding: '4px', textAlign: 'right', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: 700, background: 'var(--bg-base)' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent)' }}>Desc %</span>
                        <input 
                          type="number" 
                          value={item.discountPct} 
                          onChange={e => {
                            const newDisc = Number(e.target.value);
                            setCart(prev => prev.map(i => i.variant.id === item.variant.id ? { ...i, discountPct: newDisc } : i));
                          }}
                          style={{ width: '50px', padding: '2px', textAlign: 'right', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '12px' }}
                        />
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 900 }}>
                        {fmtCurrency((item.variant.basePrice * item.qty) * (1 - item.discountPct / 100))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Pay */}
        <div style={{ borderTop: '2px solid var(--border)', padding: '16px', background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span>{fmtCurrency(subtotal)}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}><Percent size={14} /> Descuento %</span>
            <input 
              type="number" min="0" max="100" 
              value={cartDiscountPct} 
              onChange={e => setCartDiscountPct(Number(e.target.value))}
              style={{ width: '60px', padding: '4px', textAlign: 'right', border: '1px solid var(--border)', borderRadius: '4px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
            <span style={{ fontSize: '18px', fontWeight: 800 }}>Total</span>
            <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--green)', lineHeight: 1 }}>{fmtCurrency(grandTotal)}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <Button 
              variant="secondary" 
              style={{ height: '56px' }}
              disabled={cart.length === 0 || checkoutMutation.isPending}
              onClick={handleSaveQuote}
            >
              Guardar Presupuesto
            </Button>
            <Button 
              variant="primary" 
              style={{ height: '56px', fontSize: '18px' }}
              disabled={cart.length === 0}
              onClick={handleCheckout}
            >
              Cobrar ({cart.reduce((a,c) => a + c.qty, 0)} ítems)
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Drawer open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Confirmar Cobro" width="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ textAlign: 'center', padding: '24px', background: 'var(--blue-bg)', borderRadius: '12px' }}>
            <p style={{ margin: '0 0 8px', color: 'var(--blue)', fontWeight: 600 }}>Total a Cobrar</p>
            <h1 style={{ margin: 0, fontSize: '48px', color: 'var(--text-primary)' }}>{fmtCurrency(grandTotal)}</h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600 }}>Método de Pago</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Button variant={paymentMethod === 'CASH' ? 'primary' : 'secondary'} onClick={() => setPaymentMethod('CASH')} icon={<Banknote size={18} />}>Efectivo</Button>
              <Button variant={paymentMethod === 'CREDIT_CARD' ? 'primary' : 'secondary'} onClick={() => setPaymentMethod('CREDIT_CARD')} icon={<CreditCard size={18} />}>Tarjeta</Button>
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 600 }}>Paga con ($)</label>
              <Input 
                type="number" 
                min={grandTotal}
                value={amountTendered} 
                onChange={e => setAmountTendered(Number(e.target.value))} 
                style={{ fontSize: '24px', padding: '12px' }}
              />
              {amountTendered >= grandTotal && (
                <div style={{ marginTop: '12px', padding: '16px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '13px' }}>Vuelto a entregar</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>{fmtCurrency(amountTendered - grandTotal)}</p>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
            <Button 
              variant="primary" 
              style={{ width: '100%', height: '56px', fontSize: '18px' }}
              onClick={() => checkoutMutation.mutate()}
              loading={checkoutMutation.isPending}
              disabled={paymentMethod === 'CASH' && amountTendered < grandTotal}
            >
              Confirmar e Imprimir Ticket
            </Button>
          </div>

        </div>
      </Drawer>

    </div>
  );
}
