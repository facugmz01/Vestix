import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Monitor, Search, Trash2, ShoppingCart, User, Plus, Minus, CreditCard, Banknote, Percent, LogOut, PackageOpen, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

import { posApi } from '@/api/pos.api';
import { salesApi } from '@/api/sales.api';
import { customersApi } from '@/api/customers.api';
import { get } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useAuthStore } from '@/store/auth.store';
import type { CashRegister, ProductVariant } from '@/types';

import { Button, Input, Drawer } from '@/components/ui';

import { CustomerFormDrawer } from '@/features/customers/components/CustomerFormDrawer';

// Subcomponents
function SessionModal({ 
  open, availableRegisters, onOpenSession, isPending 
}: { 
  open: boolean, availableRegisters?: CashRegister[], onOpenSession?: (id: string, amt: number) => void, isPending?: boolean 
}) {
  const [selectedReg, setSelectedReg] = useState('');
  const [amount, setAmount] = useState(0);

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg-base)', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <h2 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', fontWeight: 800 }}><Monitor size={28} color="var(--accent)" /> Apertura de Caja</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px', lineHeight: 1.5 }}>
          Para comenzar a operar, debés abrir una caja registradora asignando el saldo inicial de efectivo.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Seleccionar Caja</label>
            <select value={selectedReg} onChange={e => setSelectedReg(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '15px', outline: 'none' }}>
              <option value="">-- Cajas Disponibles --</option>
              {Array.isArray(availableRegisters) && availableRegisters.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          
          <Input 
            label="Fondo de Caja (Efectivo Inicial)" 
            type="number" 
            min="0" 
            value={amount} 
            onChange={e => setAmount(Number(e.target.value))} 
            style={{ fontSize: '16px', padding: '12px' }}
          />

          <Button 
            variant="primary" 
            style={{ marginTop: '8px', height: '52px', fontSize: '16px', fontWeight: 800, borderRadius: '8px' }} 
            disabled={!selectedReg || isPending}
            loading={isPending}
            onClick={() => onOpenSession?.(selectedReg, amount)}
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
  const navigate = useNavigate();
  
  // 1. Session Management
  const { user } = useAuthStore();
  
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: queryKeys.pos.session(),
    queryFn: () => posApi.getMyRegister(),
  });
  
  const currentBranchId = session?.branchId || user?.branchId || '';

  const { data: registersData } = useQuery({
    queryKey: queryKeys.pos.registers(currentBranchId),
    queryFn: () => posApi.getAvailableRegisters(currentBranchId),
    enabled: !isSessionLoading && !session,
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
  const [customerFormOpen, setCustomerFormOpen] = useState(false);

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
    queryFn: () => customersApi.getCustomers({ pageSize: 1000 }), // Load a decent amount for POS
  });

  // Derived Totals
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
    mutationFn: async (status: 'CONFIRMED' | 'QUOTATION' = 'CONFIRMED') => {
      if (!session) throw new Error('No hay sesión de caja activa');

      const warehouses = await queryClient.fetchQuery({
        queryKey: ['warehouses', session.branchId],
        queryFn: () => get<any[]>('/inventory/warehouses', { params: { branchId: session.branchId } })
      });
      const warehouseId = warehouses?.[0]?.id || 'main';

      const accounts = await queryClient.fetchQuery({
        queryKey: ['accounts', session.branchId],
        queryFn: () => get<any[]>('/finance/accounts', { params: { branchId: session.branchId } })
      });
      const paymentAccountId = accounts?.find(a => a.isActive)?.id;

      if (status === 'CONFIRMED' && !paymentAccountId && paymentMethod !== 'CUSTOMER_CREDIT') {
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
      toast.success(status === 'QUOTATION' ? 'Presupuesto guardado' : 'Venta registrada con éxito');
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
    checkoutMutation.mutate('QUOTATION');
  };

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  if (isSessionLoading) return <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px', fontWeight: 600 }}>Cargando terminal POS...</div>;

  return (
    <>
      <style>{`
        .pos-wrapper {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 60px);
          margin: -24px;
          background: var(--bg-base);
          overflow: hidden;
        }
        .pos-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: #0f172a;
          color: #fff;
          flex-shrink: 0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          z-index: 10;
        }
        .pos-header-btn {
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          transition: background 0.2s;
        }
        .pos-header-btn:hover {
          background: rgba(255,255,255,0.2);
        }
        .pos-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .pos-products-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--bg-base);
        }
        .pos-cart-panel {
          width: 420px;
          display: flex;
          flex-direction: column;
          background: #fff;
          border-left: 1px solid #e2e8f0;
          box-shadow: -4px 0 15px rgba(0,0,0,0.03);
          z-index: 5;
        }
        /* Dark mode overrides for cart panel if needed */
        [data-theme='dark'] .pos-cart-panel {
          background: var(--bg-elevated);
          border-left: 1px solid var(--border);
        }
        
        @media (max-width: 1024px) {
          .pos-body {
            flex-direction: column;
            overflow: auto;
          }
          .pos-wrapper {
            height: auto;
            min-height: calc(100vh - 60px);
            overflow: visible;
          }
          .pos-products-panel {
            min-height: 50vh;
            overflow: visible;
          }
          .pos-cart-panel {
            width: 100%;
            border-left: none;
            border-top: 2px solid var(--border);
            height: auto;
          }
        }
      `}</style>
      
      <div className="pos-wrapper">
        
        {/* Session Blocker */}
        <SessionModal 
          open={!session && !isSessionLoading} 
          availableRegisters={registersData || []} 
          onOpenSession={(id, amt) => openSessionMutation.mutate({ id, amt })} 
          isPending={openSessionMutation.isPending}
        />

        {/* TOP HEADER */}
        <div className="pos-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button className="pos-header-btn" onClick={() => navigate('/')}>
              <LogOut size={18} /> Salir
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#3b82f6', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>E</div>
              <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.5px' }}>Terminal POS</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', fontWeight: 600 }}>
            {session && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '6px 12px', borderRadius: '20px' }}>
                <span style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }}></span>
                {session.name}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
              <User size={16} /> {user?.fullName || user?.email}
            </div>
          </div>
        </div>

        <div className="pos-body">
          {/* LEFT: Search & Products */}
          <div className="pos-products-panel">
            <div style={{ padding: '24px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
                <Search size={24} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-muted)' }} />
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Escanear Código de Barras o Buscar Producto..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ 
                    width: '100%', padding: '16px 16px 16px 52px', borderRadius: '12px', 
                    border: '2px solid #3b82f6', fontSize: '18px', background: 'var(--bg-base)', 
                    color: 'var(--text-primary)', outline: 'none', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                    boxSizing: 'border-box'
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '16px', top: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <Minus size={24} style={{ transform: 'rotate(45deg)' }} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              {search.length < 3 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ textAlign: 'center', maxWidth: '300px' }}>
                    <PackageOpen size={64} style={{ opacity: 0.2, margin: '0 auto 24px' }} />
                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>Listo para cobrar</h3>
                    <p style={{ fontSize: '15px', lineHeight: 1.5 }}>Utilizá el lector de código de barras o buscá manualmente por nombre o SKU.</p>
                  </div>
                </div>
              ) : isSearching ? (
                <div style={{ textAlign: 'center', padding: '60px', fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' }}>Buscando productos...</div>
              ) : searchResults && searchResults.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {searchResults.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => handleAddToCart(p)}
                      style={{ 
                        background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px', 
                        padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', 
                        transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#3b82f6' }}></div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', fontWeight: 600, background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start' }}>
                        {p.sku}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.3, color: 'var(--text-primary)' }}>
                        {(p as any).productName || 'Producto'} {p.size ? `- T. ${p.size}` : ''}
                      </span>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginTop: 'auto' }}>
                        {fmtCurrency(p.basePrice)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444', fontSize: '18px', fontWeight: 600 }}>
                  No se encontraron resultados para "{search}".
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Cart & Checkout */}
          <div className="pos-cart-panel">
            
            {/* Customer Selector */}
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Cliente
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <select 
                    value={selectedCustomerId} 
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 38px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, outline: 'none', appearance: 'none' }}
                  >
                    <option value="">Consumidor Final</option>
                    {customersData?.data.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </div>
                <Button variant="secondary" onClick={() => setCustomerFormOpen(true)} title="Nuevo Cliente" style={{ padding: '10px', height: '42px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </Button>
              </div>
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--bg-elevated)' }}>
              {cart.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={56} style={{ marginBottom: '16px', color: '#cbd5e1' }} />
                  <p style={{ fontSize: '16px', fontWeight: 600 }}>El carrito está vacío</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cart.map(item => (
                    <div key={item.variant.id} style={{ padding: '16px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                            {(item.variant as any).productName || 'Producto'} {item.variant.size ? `- T. ${item.variant.size}` : ''}
                          </p>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.variant.sku}</span>
                        </div>
                        <button style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#ef4444' }} onClick={() => removeLine(item.variant.id)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                          <button onClick={() => updateQty(item.variant.id, -1)} style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }}><Minus size={16} /></button>
                          <span style={{ fontWeight: 800, width: '32px', textAlign: 'center', fontSize: '15px' }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.variant.id, 1)} style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-primary)' }}><Plus size={16} /></button>
                        </div>
                        
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Precio:</span>
                            <input 
                              type="number" 
                              value={item.variant.basePrice} 
                              onChange={e => {
                                const newPrice = Number(e.target.value);
                                setCart(prev => prev.map(i => i.variant.id === item.variant.id ? { ...i, variant: { ...i.variant, basePrice: newPrice } } : i));
                              }}
                              style={{ width: '90px', padding: '6px', textAlign: 'right', border: '1px solid var(--border)', borderRadius: '6px', fontWeight: 700, background: 'var(--bg-base)', fontSize: '14px', outline: 'none' }}
                            />
                          </div>
                          {/* Removing line discount input from normal view to simplify UI, but keeping if needed. Let's make it a small input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600 }}>Desc %:</span>
                            <input 
                              type="number" 
                              value={item.discountPct} 
                              onChange={e => {
                                const newDisc = Number(e.target.value);
                                setCart(prev => prev.map(i => i.variant.id === item.variant.id ? { ...i, discountPct: newDisc } : i));
                              }}
                              style={{ width: '60px', padding: '4px 6px', textAlign: 'right', border: '1px solid #bfdbfe', borderRadius: '6px', fontSize: '13px', background: '#eff6ff', color: '#1d4ed8', outline: 'none' }}
                            />
                          </div>
                          <p style={{ margin: '6px 0 0', fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
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
            <div style={{ padding: '24px', background: 'var(--bg-base)', boxShadow: '0 -4px 15px rgba(0,0,0,0.05)', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{fmtCurrency(subtotal)}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', marginBottom: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontWeight: 600 }}>
                  <Percent size={16} /> Descuento Gral %
                </span>
                <input 
                  type="number" min="0" max="100" 
                  value={cartDiscountPct} 
                  onChange={e => setCartDiscountPct(Number(e.target.value))}
                  style={{ width: '70px', padding: '6px', textAlign: 'right', border: '1px solid #bfdbfe', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px', borderTop: '2px dashed var(--border)', marginBottom: '20px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Total</span>
                <span style={{ fontSize: '38px', fontWeight: 900, color: '#10b981', lineHeight: 1, letterSpacing: '-1px' }}>{fmtCurrency(grandTotal)}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <Button 
                  variant="primary" 
                  style={{ height: '64px', fontSize: '20px', fontWeight: 900, borderRadius: '12px', background: '#0f172a', display: 'flex', justifyContent: 'center', gap: '12px' }}
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  Cobrar <ChevronRight size={24} />
                </Button>
                <Button 
                  variant="secondary" 
                  style={{ height: '48px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', color: 'var(--text-secondary)' }}
                  disabled={cart.length === 0 || checkoutMutation.isPending}
                  onClick={handleSaveQuote}
                >
                  Guardar Presupuesto
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        <Drawer open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Confirmar Cobro" width="sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
            
            <div style={{ textAlign: 'center', padding: '32px 24px', background: '#f0fdf4', borderRadius: '16px', border: '1px solid #bbf7d0' }}>
              <p style={{ margin: '0 0 8px', color: '#166534', fontWeight: 700, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Monto a Cobrar</p>
              <h1 style={{ margin: 0, fontSize: '56px', color: '#15803d', fontWeight: 900, letterSpacing: '-1px' }}>{fmtCurrency(grandTotal)}</h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>Método de Pago</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { id: 'CASH', label: 'Efectivo', icon: Banknote },
                  { id: 'CREDIT_CARD', label: 'Tarjeta', icon: CreditCard },
                  { id: 'BANK_TRANSFER', label: 'Transf.', icon: Percent },
                  { id: 'CUSTOMER_CREDIT', label: 'Cta. Cte.', icon: User },
                ].map(pm => {
                  const isSel = paymentMethod === pm.id;
                  return (
                    <button 
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id as any)}
                      style={{ 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
                        padding: '16px', borderRadius: '12px', border: `2px solid ${isSel ? '#3b82f6' : 'var(--border)'}`, 
                        background: isSel ? '#eff6ff' : 'var(--bg-base)', color: isSel ? '#1d4ed8' : 'var(--text-secondary)',
                        fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      <pm.icon size={28} />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {paymentMethod === 'CASH' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <label style={{ fontWeight: 800, fontSize: '16px' }}>Paga con ($)</label>
                <Input 
                  type="number" 
                  min={grandTotal}
                  value={amountTendered} 
                  onChange={e => setAmountTendered(Number(e.target.value))} 
                  style={{ fontSize: '28px', padding: '16px', fontWeight: 800, textAlign: 'center', borderRadius: '12px' }}
                />
                {amountTendered >= grandTotal && (
                  <div style={{ marginTop: '12px', padding: '20px', background: '#fff', border: '2px solid #10b981', color: '#10b981', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: '#047857' }}>Vuelto a entregar</p>
                    <p style={{ margin: 0, fontSize: '36px', fontWeight: 900 }}>{fmtCurrency(amountTendered - grandTotal)}</p>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
              <Button 
                variant="primary" 
                style={{ width: '100%', height: '64px', fontSize: '20px', fontWeight: 900, borderRadius: '12px', background: '#0f172a' }}
                onClick={() => checkoutMutation.mutate('CONFIRMED')}
                loading={checkoutMutation.isPending}
                disabled={paymentMethod === 'CASH' && amountTendered < grandTotal}
              >
                Confirmar Pago
              </Button>
            </div>

          </div>
        </Drawer>

        <CustomerFormDrawer 
          open={customerFormOpen} 
          onClose={() => setCustomerFormOpen(false)} 
        />
      </div>
    </>
  );
}
