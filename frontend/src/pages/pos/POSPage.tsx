import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Trash2, User, Plus, Minus, CreditCard, Banknote, 
  LogOut, Maximize, Calculator, Clock, PauseCircle, FileText, 
  Layers, Tags, XCircle
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

  // Fetch some products for the right grid (mocking a "All products" view)
  const { data: gridProducts } = useQuery({
    queryKey: ['pos', 'gridProducts'],
    queryFn: () => posApi.searchProduct(''), // Assuming empty search returns popular or all
  });

  const { data: searchResults } = useQuery({
    queryKey: ['pos', 'search', search],
    queryFn: () => posApi.searchProduct(search),
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
        paymentMethod: paymentMethod === 'MULTIPLE' ? 'CASH' : paymentMethod, // Fallback for now
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
    <>
      {/* GLOBAL STYLES FOR POS */}      <style>{`
        .pos-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          background: var(--bg-base);
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        .pos-navbar {
          background: rgba(19, 22, 30, 0.8);
          backdrop-filter: blur(12px);
          color: var(--text-primary);
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          z-index: 10;
        }
        .pos-nav-logo {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(to right, #fff, #9ca3af);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .pos-nav-logo span {
          font-weight: 300;
        }
        .pos-nav-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .pos-icon-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .pos-icon-btn:hover { 
          background: var(--bg-overlay); 
          color: var(--text-primary); 
          border-color: var(--border);
        }
        .pos-main {
          display: flex;
          flex: 1;
          overflow: hidden;
          padding: 16px;
          gap: 16px;
        }
        .pos-left {
          flex: 6.5;
          display: flex;
          flex-direction: column;
          background: rgba(26, 30, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }
        .pos-right {
          flex: 3.5;
          display: flex;
          flex-direction: column;
          background: rgba(26, 30, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }
        .pos-cart-top {
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pos-search-input {
          flex: 1;
          padding: 12px 16px 12px 42px;
          border: 1px solid var(--border);
          background: rgba(0,0,0,0.2);
          color: var(--text-primary);
          border-radius: 99px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .pos-search-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-glow);
          background: rgba(0,0,0,0.3);
        }
        .pos-table-container {
          flex: 1;
          overflow-y: auto;
          background: transparent;
        }
        .pos-table {
          width: 100%;
          border-collapse: collapse;
        }
        .pos-table th {
          background: rgba(0,0,0,0.2);
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          backdrop-filter: blur(10px);
          z-index: 5;
        }
        .pos-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          font-size: 14px;
          vertical-align: middle;
          color: var(--text-primary);
        }
        .pos-qty-input {
          width: 48px;
          text-align: center;
          padding: 6px;
          border: 1px solid var(--border);
          background: rgba(0,0,0,0.2);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          font-weight: 600;
          outline: none;
        }
        .pos-qty-input:focus {
          border-color: var(--accent);
        }
        .qty-btn {
          padding: 6px;
          border: 1px solid var(--border);
          background: var(--bg-overlay);
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: all 0.1s;
        }
        .qty-btn:hover {
          background: var(--bg-elevated);
          border-color: var(--text-muted);
        }
        .qty-btn:active {
          transform: scale(0.95);
        }
        .pos-summary {
          background: rgba(0,0,0,0.2);
          border-top: 1px solid var(--border);
          padding: 16px;
        }
        .pos-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 8px;
          color: var(--text-secondary);
        }
        .pos-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(to right, rgba(99,102,241,0.1), rgba(99,102,241,0.02));
          border: 1px solid var(--border-focus);
          padding: 16px;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          border-radius: var(--radius);
          margin-top: 8px;
          box-shadow: 0 4px 20px var(--accent-glow);
        }
        .pos-action-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border-top: 1px solid var(--border);
        }
        .pos-btn {
          padding: 16px 8px;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-sm);
        }
        .pos-btn:hover { 
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          filter: brightness(1.1);
        }
        .pos-btn:active {
          transform: translateY(0);
        }
        .pos-btn:disabled { 
          opacity: 0.4; 
          cursor: not-allowed; 
          transform: none !important;
          box-shadow: none !important;
          filter: grayscale(1);
        }
        
        .bg-draft { background: linear-gradient(135deg, var(--yellow), #ca8a04); }
        .bg-quotation { background: linear-gradient(135deg, var(--blue), #2563eb); }
        .bg-suspend { background: linear-gradient(135deg, var(--red), #dc2626); }
        .bg-credit { background: linear-gradient(135deg, var(--purple), #9333ea); }
        .bg-card { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
        .bg-multiple { background: rgba(0,0,0,0.3); color: var(--text-primary); border: 1px solid var(--border); }
        .bg-cash { 
          background: linear-gradient(135deg, var(--green), #16a34a); 
          grid-column: span 2; 
          font-size: 16px; 
          box-shadow: 0 4px 15px rgba(34,197,94,0.3);
        }
        .bg-cash:hover {
          box-shadow: 0 8px 25px rgba(34,197,94,0.5);
        }
        
        .pos-products-header {
          padding: 16px;
          display: flex;
          gap: 12px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border);
        }
        .pos-products-grid {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
          align-content: start;
        }
        .pos-product-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          overflow: hidden;
          text-align: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pos-product-card:hover { 
          border-color: var(--accent); 
          background: rgba(99,102,241,0.05);
          box-shadow: 0 8px 20px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-glow); 
          transform: translateY(-4px); 
        }
        .pos-product-card:active {
          transform: translateY(-1px);
        }
        .pos-product-img {
          height: 90px;
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .pos-product-info {
          padding: 10px 8px;
        }
        .pos-product-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 6px;
          line-height: 1.3;
          height: 31px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .pos-product-price {
          font-size: 14px;
          font-weight: 700;
          color: var(--green);
        }
      `}</style>

      <div className="pos-layout">
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
        <div className="pos-navbar">
          <div className="pos-nav-logo">
            <span style={{ fontWeight: 900 }}>Vestix</span> <span style={{ fontWeight: 300 }}>POS</span>
          </div>
          <div className="pos-nav-icons">
            <div className="pos-icon-btn"><Clock size={16} /> <LiveClock /></div>
            <button className="pos-icon-btn" onClick={() => setSuspendModalOpen(true)} title="Ventas Suspendidas">
              <PauseCircle size={18} /> {suspendedSales.length > 0 && <span style={{ background: 'var(--yellow)', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{suspendedSales.length}</span>}
            </button>
            <button className="pos-icon-btn" onClick={toggleFullScreen} title="Pantalla Completa"><Maximize size={18} /></button>
            <button className="pos-icon-btn" onClick={() => window.open('/calculator', '_blank', 'width=300,height=400')} title="Calculadora"><Calculator size={18} /></button>
            <button className="pos-icon-btn" onClick={() => setShiftModalOpen(true)} style={{ background: 'var(--red)', fontWeight: 700 }} title="Cerrar Caja">
              <LogOut size={16} /> Cerrar Caja
            </button>
            <button className="pos-icon-btn" onClick={() => navigate('/')} title="Volver al Dashboard"><LogOut size={18} /> Volver</button>
          </div>
        </div>

        <div className="pos-main">
          {/* LEFT PANE - CART */}
          <div className="pos-left">
            <div className="pos-cart-top">
              {/* Customer Select */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <select 
                    value={selectedCustomerId} 
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px 8px 34px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-overlay)', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="">Cliente Ocasional / Consumidor Final</option>
                    {customersData?.data.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </div>
                <button onClick={() => setCustomerFormOpen(true)} style={{ padding: '0 15px', background: 'var(--accent)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  <Plus size={18} />
                </button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--accent)' }} />
                <input 
                  ref={searchInputRef}
                  type="text"
                  className="pos-search-input"
                  placeholder="Ingrese el nombre del producto / SKU / Escanear código de barras"
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

            {/* Cart Table */}
            <div className="pos-table-container">
              <table className="pos-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Producto</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Cant.</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Precio</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>Desc%</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Subtotal</th>
                    <th style={{ width: '5%', textAlign: 'center' }}><Trash2 size={16} /></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No hay productos agregados
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, index) => (
                      <tr key={`${item.variant.id}-${index}`}>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
                          {(item.variant as any).productName || 'Producto'} {item.variant.size ? `(${item.variant.size})` : ''}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button className="qty-btn" onClick={() => updateQty(item.variant.id, item.qty - 1)}><Minus size={14} /></button>
                            <input 
                              type="number" 
                              className="pos-qty-input" 
                              value={item.qty} 
                              onChange={e => updateQty(item.variant.id, Number(e.target.value))}
                            />
                            <button className="qty-btn" onClick={() => updateQty(item.variant.id, item.qty + 1)}><Plus size={14} /></button>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                            <input 
                              type="number" 
                              style={{ width: '70px', textAlign: 'right', padding: '2px', border: '1px solid var(--border)', background: 'var(--bg-overlay)', color: 'var(--text-primary)' }}
                              value={item.variant.basePrice} 
                            onChange={e => {
                              const newPrice = Number(e.target.value);
                              setCart(prev => prev.map(i => i.variant.id === item.variant.id ? { ...i, variant: { ...i.variant, basePrice: newPrice } } : i));
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <input 
                            type="number" 
                            style={{ width: '50px', textAlign: 'right', padding: '2px', border: '1px solid var(--border)', background: 'var(--bg-overlay)', color: 'var(--text-primary)' }}
                            value={item.discountPct} 
                            onChange={e => {
                              const newDisc = Number(e.target.value);
                              setCart(prev => prev.map(i => i.variant.id === item.variant.id ? { ...i, discountPct: newDisc } : i));
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                          {fmtCurrency((item.variant.basePrice * item.qty) * (1 - item.discountPct / 100))}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => removeLine(item.variant.id)} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <XCircle size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="pos-summary">
              <div className="pos-summary-row">
                <span><b>Items:</b> {totalItems}</span>
                <span><b>Subtotal:</b> {fmtCurrency(subtotal)}</span>
              </div>
              <div className="pos-summary-row" style={{ alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <b>Descuento %:</b> 
                  <input type="number" style={{ width: '60px', padding: '2px', border: '1px solid var(--border)' }} value={cartDiscountPct} onChange={e => setCartDiscountPct(Number(e.target.value))} />
                </span>
                <span style={{ color: 'var(--red)' }}><b>(-)</b> {fmtCurrency(globalDiscount + lineDiscounts)}</span>
              </div>
            </div>
            <div className="pos-total-row">
              <span>Total a Pagar</span>
              <span>{fmtCurrency(grandTotal)}</span>
            </div>

            {/* Ultimate POS Action Buttons */}
            <div className="pos-action-buttons">
              <button className="pos-btn bg-draft" disabled={cart.length === 0} onClick={() => checkoutMutation.mutate('QUOTATION')}>
                <FileText size={20} /> Borrador
              </button>
              <button className="pos-btn bg-quotation" disabled={cart.length === 0} onClick={() => checkoutMutation.mutate('QUOTATION')}>
                <FileText size={20} /> Cotización
              </button>
              <button className="pos-btn bg-suspend" disabled={cart.length === 0} onClick={suspendSale}>
                <PauseCircle size={20} /> Suspender
              </button>
              <button className="pos-btn bg-credit" disabled={cart.length === 0} onClick={() => openPayment('CUSTOMER_CREDIT')}>
                <User size={20} /> Crédito
              </button>
              <button className="pos-btn bg-card" disabled={cart.length === 0} onClick={() => openPayment('CREDIT_CARD')}>
                <CreditCard size={20} /> Tarjeta
              </button>
              <button className="pos-btn bg-multiple" disabled={cart.length === 0} onClick={() => openPayment('MULTIPLE')}>
                <Layers size={20} /> Múltiple
              </button>
              <button className="pos-btn bg-cash" disabled={cart.length === 0} onClick={() => openPayment('CASH')}>
                <Banknote size={24} /> Efectivo
              </button>
            </div>
          </div>

          {/* RIGHT PANE - PRODUCTS */}
          <div className="pos-right">
            <div className="pos-products-header">
              <select style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '3px' }}>
                <option>Todas las Categorías</option>
              </select>
              <select style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '3px' }}>
                <option>Todas las Marcas</option>
              </select>
            </div>
            <div className="pos-products-grid">
              {(search.length >= 2 ? searchResults : gridProducts)?.map(p => (
                <div key={p.id} className="pos-product-card" onClick={() => handleAddToCart(p)}>
                  <div className="pos-product-img">
                    <Tags size={32} />
                  </div>
                  <div className="pos-product-info">
                    <div className="pos-product-name">{(p as any).productName || 'Producto'} {p.size ? `(${p.size})` : ''}</div>
                    <div className="pos-product-price">{fmtCurrency(p.basePrice)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PAYMENT MODAL */}
        <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Confirmar Pago">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'var(--green)', color: 'var(--text-primary)', padding: '20px', textAlign: 'center', borderRadius: '4px' }}>
              <div style={{ fontSize: '14px', textTransform: 'uppercase' }}>Monto a Pagar</div>
              <div style={{ fontSize: '42px', fontWeight: 700 }}>{fmtCurrency(grandTotal)}</div>
            </div>

            {paymentMethod === 'CASH' && (
              <div>
                <label style={{ fontWeight: 'bold' }}>Monto Recibido</label>
                <Input 
                  type="number" 
                  min={grandTotal}
                  value={amountTendered} 
                  onChange={e => setAmountTendered(Number(e.target.value))} 
                  style={{ fontSize: '24px', padding: '10px' }}
                />
                {amountTendered > grandTotal && (
                  <div style={{ marginTop: '15px', color: 'var(--red)', fontSize: '20px', fontWeight: 'bold' }}>
                    Vuelto: {fmtCurrency(amountTendered - grandTotal)}
                  </div>
                )}
              </div>
            )}

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={issueInvoice} onChange={e => setIssueInvoice(e.target.checked)} />
                Imprimir Ticket Fiscal AFIP
              </label>
            </div>

            <Button 
              variant="primary" 
              style={{ height: '50px', fontSize: '18px', background: 'var(--green)', border: 'none' }}
              onClick={() => checkoutMutation.mutate('CONFIRMED')}
              loading={checkoutMutation.isPending}
            >
              Completar Venta
            </Button>
          </div>
        </Modal>

        {/* SUSPENDED SALES MODAL */}
        <Modal open={suspendModalOpen} onClose={() => setSuspendModalOpen(false)} title="Ventas Suspendidas">
          {suspendedSales.length === 0 ? (
            <p>No hay ventas en suspenso.</p>
          ) : (
            <table className="pos-table" style={{ border: '1px solid #ddd' }}>
              <thead><tr><th>Fecha</th><th>Cliente</th><th>Total</th><th>Acción</th></tr></thead>
              <tbody>
                {suspendedSales.map(sale => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.date).toLocaleString()}</td>
                    <td>{customersData?.data.find(c => c.id === sale.customerId)?.fullName || 'Consumidor Final'}</td>
                    <td style={{ fontWeight: 'bold' }}>{fmtCurrency(sale.total)}</td>
                    <td>
                      <Button variant="primary" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => resumeSale(sale.id)}>
                        Retomar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>

        <CustomerFormDrawer open={customerFormOpen} onClose={() => setCustomerFormOpen(false)} />
      </div>
    </>
  );
}
