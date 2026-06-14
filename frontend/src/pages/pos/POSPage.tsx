import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Trash2, User, Plus, Minus, CreditCard, Banknote, 
  LogOut, Maximize, Calculator, Clock, PauseCircle, FileText, 
  Layers, Tags
} from 'lucide-react';
import toast from 'react-hot-toast';

import { posApi } from '@/api/pos.api';
import { salesApi } from '@/api/sales.api';
import { customersApi } from '@/api/customers.api';
import { treasuryApi } from '@/api/treasury.api';
import { get } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import { useAuthStore } from '@/store/auth.store';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import type { ProductVariant } from '@/types';
import { Button, Input, Modal } from '@/components/ui';
import { CustomerFormDrawer } from '@/features/customers/components/CustomerFormDrawer';
import { ShiftManagerModal } from '@/features/sales/components/ShiftManagerModal';
import styles from './POSPage.module.css';

// --- Live Clock ---
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span>{time.toLocaleTimeString()}</span>;
}

// --- Main POS Component ---
export default function POSPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const { user } = useAuthStore();
  const enqueueOfflineOp = useOfflineQueueStore((s) => s.enqueue);

  // --- State ---
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [cart, setCart] = useState<{ variant: ProductVariant, qty: number, discountPct: number }[]>([]);
  const [cartDiscountPct, setCartDiscountPct] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH'|'CREDIT_CARD'|'CUSTOMER_CREDIT'|'BANK_TRANSFER'|'MULTIPLE'>('CASH');
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [issueInvoice, setIssueInvoice] = useState(false);
  
  // Suspend Sales
  const [suspendedSales, setSuspendedSales] = useState<any[]>([]);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);

  // Load suspended sales from local storage
  useEffect(() => {
    const saved = localStorage.getItem('vestix_suspended_sales');
    if (saved) setSuspendedSales(JSON.parse(saved));
  }, []);

  // --- Queries ---
  const { data: activeShift, isLoading: isShiftLoading } = useQuery({
    queryKey: ['shifts', 'active'],
    queryFn: () => treasuryApi.getActiveShift(),
  });
  
  const currentBranchId = user?.branchId || '';

  const { data: registersData } = useQuery({
    queryKey: queryKeys.pos.registers(currentBranchId),
    queryFn: () => posApi.getAvailableRegisters(currentBranchId),
    enabled: !isShiftLoading && !activeShift,
  });

  const { data: gridProducts } = useQuery({
    queryKey: ['pos', 'gridProducts', selectedCustomerId],
    queryFn: () => posApi.searchProduct('', selectedCustomerId || undefined),
  });

  const { data: searchResults } = useQuery({
    queryKey: ['pos', 'search', search, selectedCustomerId],
    queryFn: () => posApi.searchProduct(search, selectedCustomerId || undefined),
    enabled: search.length >= 2,
  });

  const { data: customersData } = useQuery({
    queryKey: queryKeys.customers.all(),
    queryFn: () => customersApi.getCustomers({ pageSize: 1000 }),
  });

  // --- Computed ---
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.variant.basePrice * item.qty), 0);
  const lineDiscounts = cart.reduce((acc, item) => acc + ((item.variant.basePrice * item.qty) * (item.discountPct / 100)), 0);
  const totalAfterLines = subtotal - lineDiscounts;
  const globalDiscount = totalAfterLines * (cartDiscountPct / 100);
  const grandTotal = totalAfterLines - globalDiscount;

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  // --- Handlers ---
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

  const updateQty = (id: string, newQty: number) => {
    if (newQty < 1) return;
    setCart(prev => prev.map(i => i.variant.id === id ? { ...i, qty: newQty } : i));
  };

  const removeLine = (id: string) => {
    setCart(prev => prev.filter(i => i.variant.id !== id));
  };

  const suspendSale = () => {
    if (cart.length === 0) return;
    const sale = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      cart,
      customerId: selectedCustomerId,
      discount: cartDiscountPct,
      total: grandTotal
    };
    const newSuspended = [...suspendedSales, sale];
    setSuspendedSales(newSuspended);
    localStorage.setItem('vestix_suspended_sales', JSON.stringify(newSuspended));
    toast.success('Venta suspendida (Hold)');
    setCart([]);
    setSelectedCustomerId('');
  };

  const resumeSale = (saleId: string) => {
    const sale = suspendedSales.find(s => s.id === saleId);
    if (!sale) return;
    setCart(sale.cart);
    setSelectedCustomerId(sale.customerId);
    setCartDiscountPct(sale.discount);
    
    const newSuspended = suspendedSales.filter(s => s.id !== saleId);
    setSuspendedSales(newSuspended);
    localStorage.setItem('vestix_suspended_sales', JSON.stringify(newSuspended));
    setSuspendModalOpen(false);
  };

  const checkoutMutation = useMutation({
    mutationFn: async (status: 'CONFIRMED' | 'QUOTATION' = 'CONFIRMED') => {
      if (!activeShift) throw new Error('No hay sesión de caja activa');
      const orderId = crypto.randomUUID();
      
      let warehouseId = 'main';
      try {
        const warehouses = await queryClient.fetchQuery({
          queryKey: ['warehouses', currentBranchId],
          queryFn: () => get<any[]>('/inventory/warehouses', { params: { branchId: currentBranchId } }),
          staleTime: 600_000,
        });
        warehouseId = warehouses?.[0]?.id || 'main';
      } catch { warehouseId = 'main'; }

      let paymentAccountId: string | undefined;
      try {
        const accounts = await queryClient.fetchQuery({
          queryKey: ['accounts', currentBranchId],
          queryFn: () => get<any[]>('/finance/accounts', { params: { branchId: currentBranchId } }),
          staleTime: 600_000,
        });
        paymentAccountId = accounts?.find((a: any) => a.isActive)?.id;
      } catch { paymentAccountId = undefined; }

      const dto = {
        id: orderId,
        branchId: currentBranchId,
        warehouseId,
        customerId: selectedCustomerId || undefined,
        source: 'POS' as const,
        paymentMethod: paymentMethod === 'MULTIPLE' ? 'CASH' : paymentMethod,
        paymentAccountId,
        cashShiftId: activeShift?.id,
        status: status === 'QUOTATION' ? 'QUOTE' : 'COMPLETED',
        posGrandTotal: grandTotal,
        cartDiscountTotal: grandTotal < subtotal ? subtotal - grandTotal : 0,
        createdAtIso: new Date().toISOString(),
        lines: cart.map(i => ({
          variantId: i.variant.id,
          categoryId: (i.variant as any).product?.categoryId || 'default',
          quantity: i.qty,
          unitPriceOverride: i.variant.basePrice,
          discountPct: i.discountPct,
        })),
        issueInvoice,
      };

      if (!navigator.onLine) {
        enqueueOfflineOp({
          module: 'POS', action: 'createSale', description: `Venta POS offline`,
          endpoint: '/sales/checkout', method: 'POST', maxRetries: 5, payload: dto,
        });
        return { offline: true };
      }

      try {
        const res = await salesApi.createSale(dto);
        return { offline: false, res };
      } catch (err: any) {
        if (!err.response || err.code === 'ERR_NETWORK') {
          enqueueOfflineOp({
            module: 'POS', action: 'createSale', description: `Venta POS offline`,
            endpoint: '/sales/checkout', method: 'POST', maxRetries: 5, payload: dto,
          });
          return { offline: true };
        }
        throw err;
      }
    },
    onSuccess: (data: any, status) => {
      toast.success(data?.offline ? 'Registrado offline' : (status === 'QUOTATION' ? 'Presupuesto Creado' : 'Venta Pagada!'));
      setCart([]);
      setCartDiscountPct(0);
      setSelectedCustomerId('');
      setPaymentModalOpen(false);
      setAmountTendered(0);
    },
    onError: (err: any) => toast.error(err.message || 'Error al cobrar'),
  });

  const openPayment = (method: typeof paymentMethod) => {
    if (cart.length === 0) return;
    setPaymentMethod(method);
    setAmountTendered(grandTotal);
    setPaymentModalOpen(true);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  if (isShiftLoading) return <div style={{ padding: '40px', textAlign: 'center', fontWeight: 600 }}>Cargando estado de caja...</div>;

  return (
    <div className={styles.layout}>
      <ShiftManagerModal 
        open={!activeShift && !isShiftLoading} 
        mode="OPEN"
        activeShift={null}
        registers={registersData}
        onClose={() => {}}
      />
      
      <ShiftManagerModal 
        open={shiftModalOpen} 
        mode="CLOSE"
        activeShift={activeShift || null}
        onClose={() => setShiftModalOpen(false)}
      />

      {/* NAVBAR */}
      <div className={styles.navbar}>
        <div className={styles.navLogo}>
          <span>Vestix</span> POS
        </div>
        <div className={styles.navIcons}>
          <div className={styles.iconBtn}><Clock size={16} /> <LiveClock /></div>
          <button className={styles.iconBtn} onClick={() => setSuspendModalOpen(true)} title="Ventas Suspendidas">
            <PauseCircle size={18} /> 
            {suspendedSales.length > 0 && <span style={{ background: 'var(--yellow)', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{suspendedSales.length}</span>}
          </button>
          <button className={styles.iconBtn} onClick={toggleFullScreen} title="Pantalla Completa"><Maximize size={18} /></button>
          <button className={styles.iconBtn} onClick={() => window.open('/calculator', '_blank', 'width=300,height=400')} title="Calculadora"><Calculator size={18} /></button>
          <button className={styles.iconBtn} onClick={() => setShiftModalOpen(true)} style={{ background: 'rgba(220,38,38,0.2)', color: '#f87171', border: '1px solid rgba(220,38,38,0.4)' }} title="Cerrar Caja">
            <LogOut size={16} /> Cerrar Caja
          </button>
          <button className={styles.iconBtn} onClick={() => navigate('/')} title="Volver al Dashboard"><LogOut size={18} /> Volver</button>
        </div>
      </div>

      <div className={styles.main}>
        
        {/* LEFT PANE - PRODUCTS (Swapped for better UX) */}
        <div className={styles.productsArea}>
          <div className={styles.productsHeader}>
            <select style={{ flex: 1, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '12px', outline: 'none' }}>
              <option>Todas las Categorías</option>
            </select>
            <select style={{ flex: 1, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '12px', outline: 'none' }}>
              <option>Todas las Marcas</option>
            </select>
          </div>
          
          <div className={styles.productsGrid}>
            {(search.length >= 2 ? searchResults : gridProducts)?.map(p => (
              <div key={p.id} className={styles.productCard} onClick={() => handleAddToCart(p)}>
                <div className={styles.productImg}>
                  <Tags size={36} />
                </div>
                <div className={styles.productInfo}>
                  <div className={styles.productName}>{(p as any).productName || 'Producto'} {p.size ? `(${p.size})` : ''}</div>
                  <div className={styles.productPrice}>{fmtCurrency(p.basePrice)}</div>
                </div>
              </div>
            ))}
            
            {!(search.length >= 2 ? searchResults : gridProducts)?.length && (
              <div className={styles.emptyState}>
                <Tags size={48} />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE - CART */}
        <div className={styles.cartArea}>
          <div className={styles.cartTop}>
            {/* Customer Select */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} />
                <select 
                  value={selectedCustomerId} 
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none', appearance: 'none' }}
                >
                  <option value="">Consumidor Final</option>
                  {customersData?.data.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
              </div>
              <button onClick={() => setCustomerFormOpen(true)} style={{ padding: '0 16px', background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <Plus size={20} />
              </button>
            </div>

            {/* Search */}
            <div className={styles.searchInputWrapper}>
              <Search size={20} className={styles.searchIcon} />
              <input 
                ref={searchInputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchResults?.length === 1) {
                    handleAddToCart(searchResults[0]);
                  }
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Cart Table (Ticket List) */}
          <div className={styles.tableContainer}>
            <div className={styles.cartList}>
              {cart.length === 0 ? (
                <div className={styles.emptyState} style={{ marginTop: '40px' }}>
                  <Search size={48} opacity={0.5} />
                  <p>Escanea o busca productos</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={`${item.variant.id}-${index}`} className={styles.cartItem}>
                    <div className={styles.cartItemDetails}>
                      <span className={styles.cartItemName}>
                        {(item.variant as any).productName || 'Producto'} {item.variant.size ? `(${item.variant.size})` : ''}
                      </span>
                      <span className={styles.cartItemSku}>
                        {fmtCurrency((item.variant.basePrice * item.qty) * (1 - item.discountPct / 100))}
                      </span>
                    </div>

                    <div className={styles.qtyControl}>
                      <button className={styles.qtyBtn} onClick={() => updateQty(item.variant.id, item.qty - 1)}><Minus size={14} /></button>
                      <input 
                        type="number" 
                        className={styles.qtyInput} 
                        value={item.qty} 
                        onChange={e => updateQty(item.variant.id, Number(e.target.value))}
                      />
                      <button className={styles.qtyBtn} onClick={() => updateQty(item.variant.id, item.qty + 1)}><Plus size={14} /></button>
                    </div>

                    <button className={styles.removeBtn} onClick={() => removeLine(item.variant.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals Summary */}
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Items: {totalItems}</span>
              <span>Subtotal: {fmtCurrency(subtotal)}</span>
            </div>
            <div className={styles.summaryRow} style={{ alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Descuento Global %: 
                <input 
                  type="number" 
                  style={{ width: '60px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', color: '#fff', textAlign: 'center' }} 
                  value={cartDiscountPct} 
                  onChange={e => setCartDiscountPct(Number(e.target.value))} 
                />
              </span>
              <span style={{ color: '#f87171' }}>(-) {fmtCurrency(globalDiscount + lineDiscounts)}</span>
            </div>
            
            <div className={styles.totalRow}>
              <span>Total</span>
              <span>{fmtCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Ultimate POS Action Buttons */}
          <div className={styles.actionButtons}>
            <button className={`${styles.posBtn} ${styles.bgDraft}`} disabled={cart.length === 0} onClick={() => checkoutMutation.mutate('QUOTATION')}>
              <FileText size={20} /> Borrador
            </button>
            <button className={`${styles.posBtn} ${styles.bgQuotation}`} disabled={cart.length === 0} onClick={() => checkoutMutation.mutate('QUOTATION')}>
              <FileText size={20} /> Cotización
            </button>
            <button className={`${styles.posBtn} ${styles.bgSuspend}`} disabled={cart.length === 0} onClick={suspendSale}>
              <PauseCircle size={20} /> Suspender
            </button>
            <button className={`${styles.posBtn} ${styles.bgCredit}`} disabled={cart.length === 0} onClick={() => openPayment('CUSTOMER_CREDIT')}>
              <User size={20} /> Crédito
            </button>
            <button className={`${styles.posBtn} ${styles.bgCard}`} disabled={cart.length === 0} onClick={() => openPayment('CREDIT_CARD')}>
              <CreditCard size={20} /> Tarjeta
            </button>
            <button className={`${styles.posBtn} ${styles.bgMultiple}`} disabled={cart.length === 0} onClick={() => openPayment('MULTIPLE')}>
              <Layers size={20} /> Múltiple
            </button>
            <button className={`${styles.posBtn} ${styles.bgCash}`} disabled={cart.length === 0} onClick={() => openPayment('CASH')}>
              <Banknote size={24} /> Efectivo
            </button>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Confirmar Pago">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '24px', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ fontSize: '14px', textTransform: 'uppercase', fontWeight: 600, opacity: 0.8 }}>Monto a Cobrar</div>
            <div style={{ fontSize: '48px', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>{fmtCurrency(grandTotal)}</div>
          </div>

          {paymentMethod === 'CASH' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '10px', color: 'var(--text-secondary)' }}>Monto Recibido</label>
              <Input 
                type="number" 
                min={grandTotal}
                value={amountTendered} 
                onChange={e => setAmountTendered(Number(e.target.value))} 
                style={{ fontSize: '24px', padding: '14px', background: 'rgba(0,0,0,0.3)' }}
              />
              {amountTendered > grandTotal && (
                <div style={{ marginTop: '16px', color: '#f87171', fontSize: '22px', fontWeight: 'bold' }}>
                  Vuelto a entregar: {fmtCurrency(amountTendered - grandTotal)}
                </div>
              )}
            </div>
          )}

          <div style={{ padding: '10px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px' }}>
              <input type="checkbox" checked={issueInvoice} onChange={e => setIssueInvoice(e.target.checked)} style={{ width: '20px', height: '20px' }} />
              Emitir e Imprimir Factura Electrónica (AFIP)
            </label>
          </div>

          <Button 
            variant="primary" 
            style={{ height: '56px', fontSize: '18px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}
            onClick={() => checkoutMutation.mutate('CONFIRMED')}
            loading={checkoutMutation.isPending}
          >
            Completar Venta y Emitir Ticket
          </Button>
        </div>
      </Modal>

      {/* SUSPENDED SALES MODAL */}
      <Modal open={suspendModalOpen} onClose={() => setSuspendModalOpen(false)} title="Ventas Suspendidas">
        {suspendedSales.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
            <PauseCircle size={48} style={{ margin: '0 auto 16px' }} />
            <p>No hay ventas en suspenso.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {suspendedSales.map(sale => (
              <div key={sale.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{customersData?.data.find(c => c.id === sale.customerId)?.fullName || 'Consumidor Final'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(sale.date).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#34d399' }}>{fmtCurrency(sale.total)}</div>
                  <Button variant="primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => resumeSale(sale.id)}>
                    Retomar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <CustomerFormDrawer open={customerFormOpen} onClose={() => setCustomerFormOpen(false)} />
    </div>
  );
}
