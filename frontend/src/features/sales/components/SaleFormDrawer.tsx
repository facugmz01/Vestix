import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { salesApi, type CreateSaleDto } from '@/api/sales.api';
import { posApi } from '@/api/pos.api';
import { customersApi } from '@/api/customers.api';
import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import { settingsApi } from '@/api/settings.api';
import toast from 'react-hot-toast';
import { X, Calculator, Percent, Search, Package } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SaleFormDrawer({ open, onClose }: Props) {
  const queryClient = useQueryClient();

  const [branchId, setBranchId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<CreateSaleDto['paymentMethod']>('CASH');
  
  const [lines, setLines] = useState<{ variantId: string; variantSku: string; variantName: string; quantity: number; basePrice: number; discountPct: number }[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);

  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [qtyInput, setQtyInput] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: branchesData } = useQuery({ queryKey: queryKeys.branches.all(), queryFn: () => branchesApi.getBranches({}), enabled: open });
  const { data: customersData } = useQuery({ queryKey: queryKeys.customers.all(), queryFn: () => customersApi.getCustomers({}), enabled: open });
  const { data: pricingSettings } = useQuery({ queryKey: [...queryKeys.settings.get(), 'pricing'], queryFn: () => settingsApi.getSettings().then(d => d.pricing), enabled: open });

  const allowManualDiscount = pricingSettings?.allowManualDiscount !== false;

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['sale-form', 'product-search', searchQuery],
    queryFn: () => posApi.searchProduct(searchQuery),
    enabled: searchQuery.trim().length >= 2,
  });

  useEffect(() => {
    if (open) {
      setBranchId('');
      setWarehouseId('');
      setCustomerId('');
      setLines([]);
      setGlobalDiscount(0);
      setPaymentMethod('CASH');
      setSearchQuery('');
    }
  }, [open]);

  const selectedBranch = branchesData?.data.find(b => b.id === branchId);

  useEffect(() => {
    if (selectedBranch && (selectedBranch as any).warehouses?.length > 0) {
      setWarehouseId((selectedBranch as any).warehouses[0].id);
    } else {
      setWarehouseId('');
    }
  }, [branchId, selectedBranch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectProduct = (variant: any) => {
    const exists = lines.find(l => l.variantId === variant.id);
    if (exists) {
      setLines(lines.map(l => l.variantId === variant.id ? { ...l, quantity: l.quantity + qtyInput } : l));
    } else {
      setLines([...lines, {
        variantId: variant.id,
        variantSku: variant.sku,
        variantName: variant.product?.name || variant.sku,
        quantity: qtyInput,
        basePrice: variant.basePrice || 0,
        discountPct: 0,
      }]);
    }
    setSearchQuery('');
    setQtyInput(1);
    setShowDropdown(false);
  };

  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));
  
  const updateLine = (idx: number, field: 'quantity' | 'basePrice' | 'discountPct', value: number) => {
    const newLines = [...lines];
    (newLines[idx] as any)[field] = Math.max(field === 'discountPct' ? 0 : 0.01, field === 'discountPct' ? Math.min(100, value) : value);
    setLines(newLines);
  };

  const subtotal = lines.reduce((acc, line) => acc + (line.basePrice * line.quantity), 0);
  const lineDiscountsTotal = lines.reduce((acc, line) => acc + ((line.basePrice * line.quantity) * (line.discountPct / 100)), 0);
  const totalAfterLines = subtotal - lineDiscountsTotal;
  const cartDiscountAmt = totalAfterLines * (globalDiscount / 100);
  const grandTotal = totalAfterLines - cartDiscountAmt;

  const mutation = useMutation({
    mutationFn: (data: { status: 'QUOTATION'|'CONFIRMED' }) => {
      const payload = {
        id: crypto.randomUUID(),
        branchId,
        warehouseId,   // Send it always so we know the intended stock origin
        customerId: customerId || undefined,
        source: 'BACKOFFICE',
        paymentMethod,
        status: data.status,
        posGrandTotal: grandTotal,
        createdAtIso: new Date().toISOString(),
        cartDiscountTotal: cartDiscountAmt,
        lines: lines.map(l => ({
          variantId: l.variantId,
          categoryId: 'default',
          quantity: l.quantity,
          unitPriceOverride: l.basePrice,
          discountPct: l.discountPct,
        })),
      };
      return salesApi.createSale(payload as any);
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'QUOTATION' ? 'Presupuesto creado con éxito' : 'Venta Confirmada');
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all() });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message || 'Error al procesar la operación'),
  });

  const handleSave = (status: 'QUOTATION' | 'CONFIRMED') => {
    if (!branchId) { toast.error('Debe seleccionar una sucursal origen'); return; }
    if (lines.length === 0) { toast.error('Agregue al menos un artículo'); return; }
    mutation.mutate({ status });
  };

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  const results = searchResults as any[];

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Sucursal Emisora *</label>
            <select value={branchId} onChange={e => setBranchId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
              <option value="">Seleccionar Sucursal...</option>
              {branchesData?.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Depósito / Stock *</label>
            <select 
              value={warehouseId} 
              onChange={e => setWarehouseId(e.target.value)} 
              disabled={!branchId}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', opacity: branchId ? 1 : 0.5 }}
            >
              <option value="">Seleccionar Depósito...</option>
              {(selectedBranch as any)?.warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Cliente (Opcional)</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
              <option value="">Consumidor Final</option>
              {customersData?.data.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>Forma de Pago</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
              <option value="CASH">Efectivo</option>
              <option value="CREDIT_CARD">Tarjeta (Débito/Crédito)</option>
              <option value="BANK_TRANSFER">Transferencia</option>
              <option value="CUSTOMER_CREDIT">Cuenta Corriente</option>
            </select>
          </div>
        </div>

        {/* Buscador de Productos */}
        <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={16} /> Detalle del Carrito
          </h4>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'flex-end' }}>
            {/* Search Input with Dropdown */}
            <div style={{ flex: 3, position: 'relative' }} ref={searchRef}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                Buscar Producto
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Nombre, SKU, código de barras, color, marca..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 34px',
                    borderRadius: '6px',
                    border: '2px solid var(--accent)',
                    fontSize: '14px',
                    background: 'var(--bg-base)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Results Dropdown */}
              {showDropdown && searchQuery.trim().length >= 2 && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  zIndex: 9999,
                  maxHeight: '280px',
                  overflowY: 'auto',
                }}>
                  {isSearching ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      Buscando...
                    </div>
                  ) : results && results.length > 0 ? (
                    results.map((v: any) => (
                      <div
                        key={v.id}
                        onClick={() => handleSelectProduct(v)}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px' }}>
                            {v.product?.name || 'Producto'} 
                            {v.size && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>Talle {v.size}</span>}
                            {v.color && <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>{v.color}</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                            <span>SKU: <strong style={{ fontFamily: 'monospace' }}>{v.sku}</strong></span>
                            {v.product?.brand?.name && <span>· {v.product.brand.name}</span>}
                            {v.product?.category?.name && <span>· {v.product.category.name}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                          <div style={{ fontWeight: 900, fontSize: '15px', color: 'var(--accent)' }}>{fmtCurrency(v.basePrice)}</div>
                          {v.stockLevels?.length > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                              <Package size={10} />
                              Stock: {v.stockLevels.reduce((a: number, s: any) => a + s.availableQuantity, 0)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No se encontraron productos para "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ flex: 0.6 }}>
              <Input label="Cant." type="number" min="1" value={qtyInput} onChange={e => setQtyInput(Number(e.target.value))} />
            </div>
          </div>

          {/* Lines Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 600 }}>Producto</th>
                <th style={{ padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 600 }}>Precio U. ($)</th>
                <th style={{ padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 600 }}>Cant.</th>
                <th style={{ padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 600 }}>Desc. %</th>
                <th style={{ padding: '8px 4px', color: 'var(--text-muted)', fontWeight: 600 }}>Total L.</th>
                <th style={{ padding: '8px 4px' }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Buscá un producto arriba para agregarlo al carrito
                  </td>
                </tr>
              )}
              {lines.map((l, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{l.variantName}</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{l.variantSku}</div>
                  </td>
                  <td style={{ padding: '8px 4px' }}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.basePrice}
                      onChange={e => updateLine(i, 'basePrice', Number(e.target.value))}
                      style={{ width: '80px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: 700, background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                    />
                  </td>
                  <td style={{ padding: '8px 4px' }}>
                    <input
                      type="number"
                      min="1"
                      value={l.quantity}
                      onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                      style={{ width: '55px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '4px', fontWeight: 600, background: 'var(--bg-base)', color: 'var(--text-primary)' }}
                    />
                  </td>
                  <td style={{ padding: '8px 4px' }}>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={l.discountPct}
                      onChange={e => updateLine(i, 'discountPct', Number(e.target.value))}
                      disabled={!allowManualDiscount}
                      title={!allowManualDiscount ? 'Descuentos manuales deshabilitados' : ''}
                      style={{ width: '55px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: '4px', background: !allowManualDiscount ? 'var(--bg-elevated)' : 'var(--bg-base)', color: !allowManualDiscount ? 'var(--text-muted)' : 'var(--text-primary)', opacity: !allowManualDiscount ? 0.6 : 1 }}
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
              min="0"
              max="100"
              value={globalDiscount}
              onChange={e => setGlobalDiscount(Number(e.target.value))}
              disabled={!allowManualDiscount}
              title={!allowManualDiscount ? 'Descuentos manuales deshabilitados' : ''}
              style={{ width: '60px', padding: '4px', textAlign: 'right', border: '1px solid var(--border)', borderRadius: '4px', background: !allowManualDiscount ? 'var(--bg-elevated)' : 'var(--bg-base)', color: !allowManualDiscount ? 'var(--text-muted)' : 'var(--text-primary)', opacity: !allowManualDiscount ? 0.6 : 1 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 900, marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <span>Total Neto:</span>
            <span style={{ color: 'var(--accent)' }}>{fmtCurrency(grandTotal)}</span>
          </div>
        </div>

      </div>
    </Drawer>
  );
}
