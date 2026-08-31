import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { salesApi, type CreateSaleDto } from '@/api/sales.api';
import { posApi } from '@/api/pos.api';
import { customersApi } from '@/api/customers.api';
import { branchesApi } from '@/api/branches.api';
import { queryKeys } from '@/api/queryKeys';
import { settingsApi } from '@/api/settings.api';
import { usePermissions } from '@/rbac/usePermissions';
import { SupervisorApprovalModal } from '@/components/modals/SupervisorApprovalModal';
import type { AuthorizeActionResult } from '@/api/auth.api';
import toast from 'react-hot-toast';
import { X, Calculator, Percent, DollarSign, Search, Package, Tag, Edit3, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';
import { formatCurrency } from '@/utils/formatCurrency';
import { generateUUID } from '@/utils/generateUUID';
import styles from './SaleFormDrawer.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  /** When set, opens in edit mode for an existing quotation/draft. */
  saleIdToEdit?: string | null;
}

interface SaleFormLine {
  variantId: string;
  variantSku: string;
  variantName: string;
  quantity: number;
  originalPrice: number;
  basePrice: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  discountPct: number;
  supervisorApprovalToken?: string;
}

export function SaleFormDrawer({ open, onClose, saleIdToEdit = null }: Props) {
  const queryClient = useQueryClient();
  const { can, isSuperAdmin } = usePermissions();
  const isEditing = !!saleIdToEdit;

  const [branchId, setBranchId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<CreateSaleDto['paymentMethod']>('CASH');
  const [hydratedEditId, setHydratedEditId] = useState<string | null>(null);
  
  const [lines, setLines] = useState<SaleFormLine[]>([]);
  const [globalDiscountType, setGlobalDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [globalDiscountValue, setGlobalDiscountValue] = useState<number>(0);
  const [globalSupervisorToken, setGlobalSupervisorToken] = useState<string | undefined>();

  // Supervisor modal
  const [supervisorModalOpen, setSupervisorModalOpen] = useState(false);
  const [pendingSupervisorAction, setPendingSupervisorAction] = useState<{
    action: string;
    label: string;
    onApproved: (res: AuthorizeActionResult) => void;
  } | null>(null);

  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [qtyInput, setQtyInput] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: branchesData } = useQuery({ queryKey: queryKeys.branches.all(), queryFn: () => branchesApi.getBranches({}), enabled: open });
  const { data: customersData } = useQuery({ queryKey: queryKeys.customers.all(), queryFn: () => customersApi.getCustomers({}), enabled: open });
  const { data: pricingSettings } = useQuery({ queryKey: [...queryKeys.settings.get(), 'pricing'], queryFn: () => settingsApi.getSettings().then(d => d.pricing), enabled: open });
  const { data: saleToEdit, isLoading: isLoadingEdit } = useQuery({
    queryKey: queryKeys.sales.detail(saleIdToEdit || ''),
    queryFn: () => salesApi.getSale(saleIdToEdit!),
    enabled: open && !!saleIdToEdit,
  });

  const allowManualDiscount = pricingSettings?.allowManualDiscount !== false;
  const hasDiscountPermission = isSuperAdmin() || can('apply', 'Discount') || can('manage', 'Sales');
  const hasPriceOverridePermission = isSuperAdmin() || can('override', 'Price') || can('manage', 'Sales');

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['sale-form', 'product-search', searchQuery],
    queryFn: () => posApi.searchProduct(searchQuery),
    enabled: searchQuery.trim().length >= 2,
  });

  useEffect(() => {
    if (!open) {
      setHydratedEditId(null);
      return;
    }
    if (saleIdToEdit) return;
    setBranchId('');
    setWarehouseId('');
    setCustomerId('');
    setLines([]);
    setGlobalDiscountType('PERCENTAGE');
    setGlobalDiscountValue(0);
    setGlobalSupervisorToken(undefined);
    setPaymentMethod('CASH');
    setSearchQuery('');
  }, [open, saleIdToEdit]);

  useEffect(() => {
    if (!open || !saleToEdit || !saleIdToEdit) return;
    if (hydratedEditId === saleIdToEdit) return;

    setBranchId(saleToEdit.branchId || '');
    setWarehouseId(saleToEdit.warehouseId || '');
    setCustomerId(saleToEdit.customerId || '');
    setPaymentMethod((saleToEdit.paymentMethod as CreateSaleDto['paymentMethod']) || 'CASH');

    const mappedLines: SaleFormLine[] = saleToEdit.lines.map((l) => {
      const lineBase = l.basePrice * l.quantity;
      const discountPct = lineBase > 0
        ? Math.round(((l.discountAmount || 0) / lineBase) * 10000) / 100
        : 0;
      return {
        variantId: l.variantId,
        variantSku: l.variantSku || l.historicalSku || l.variant?.sku || '',
        variantName: l.productName || l.historicalName || l.variant?.product?.name || l.variantSku || 'Producto',
        quantity: l.quantity,
        originalPrice: l.basePrice,
        basePrice: l.basePrice,
        discountType: 'PERCENTAGE',
        discountValue: discountPct,
        discountPct,
      };
    });
    setLines(mappedLines);

    const afterLines = mappedLines.reduce(
      (acc, l) => acc + l.basePrice * l.quantity * (1 - l.discountPct / 100),
      0,
    );
    const globalPct = afterLines > 0
      ? Math.round(((saleToEdit.cartDiscountTotal || 0) / afterLines) * 10000) / 100
      : 0;
    setGlobalDiscountType('PERCENTAGE');
    setGlobalDiscountValue(Math.min(100, Math.max(0, globalPct)));
    setHydratedEditId(saleIdToEdit);
  }, [open, saleToEdit, saleIdToEdit, hydratedEditId]);

  const selectedBranch = branchesData?.data.find(b => b.id === branchId);

  useEffect(() => {
    if (isEditing && hydratedEditId) return;
    if (selectedBranch && (selectedBranch as any).warehouses?.length > 0) {
      setWarehouseId((selectedBranch as any).warehouses[0].id);
    } else if (!isEditing) {
      setWarehouseId('');
    }
  }, [branchId, selectedBranch, isEditing, hydratedEditId]);

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
        originalPrice: variant.basePrice || 0,
        basePrice: variant.basePrice || 0,
        discountType: 'PERCENTAGE',
        discountValue: 0,
        discountPct: 0,
      }]);
    }
    setSearchQuery('');
    setQtyInput(1);
    setShowDropdown(false);
  };

  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));
  
  const updateLine = (idx: number, field: 'quantity' | 'basePrice' | 'discountValue' | 'discountType', value: any) => {
    const targetLine = lines[idx];
    if (!targetLine) return;

    if (field === 'basePrice') {
      const newPrice = Math.max(0.01, Number(value));
      const isPriceModified = Math.abs(newPrice - targetLine.originalPrice) > 0.01;
      if (isPriceModified && !hasPriceOverridePermission && !targetLine.supervisorApprovalToken) {
        setPendingSupervisorAction({
          action: 'override:Price',
          label: `Modificar Precio Unitario (${targetLine.variantSku})`,
          onApproved: (res) => {
            const next = [...lines];
            next[idx] = { ...next[idx], basePrice: newPrice, supervisorApprovalToken: res.supervisorApprovalToken };
            setLines(next);
          },
        });
        setSupervisorModalOpen(true);
        return;
      }
      const next = [...lines];
      next[idx] = { ...next[idx], basePrice: newPrice };
      setLines(next);
      return;
    }

    if (field === 'discountValue' || field === 'discountType') {
      const newType = field === 'discountType' ? value : targetLine.discountType;
      const newVal = field === 'discountValue' ? Math.max(0, Number(value)) : targetLine.discountValue;
      if (newVal > 0 && !hasDiscountPermission && !targetLine.supervisorApprovalToken) {
        setPendingSupervisorAction({
          action: 'apply:Discount',
          label: `Aplicar Descuento de Línea (${targetLine.variantSku})`,
          onApproved: (res) => {
            const next = [...lines];
            next[idx] = {
              ...next[idx],
              discountType: newType,
              discountValue: newVal,
              discountPct: newType === 'PERCENTAGE' ? newVal : (targetLine.basePrice * targetLine.quantity > 0 ? (newVal / (targetLine.basePrice * targetLine.quantity)) * 100 : 0),
              supervisorApprovalToken: res.supervisorApprovalToken,
            };
            setLines(next);
          },
        });
        setSupervisorModalOpen(true);
        return;
      }
      const next = [...lines];
      next[idx] = {
        ...next[idx],
        discountType: newType,
        discountValue: newVal,
        discountPct: newType === 'PERCENTAGE' ? newVal : (targetLine.basePrice * targetLine.quantity > 0 ? (newVal / (targetLine.basePrice * targetLine.quantity)) * 100 : 0),
      };
      setLines(next);
      return;
    }

    const next = [...lines];
    (next[idx] as any)[field] = Math.max(1, Number(value));
    setLines(next);
  };

  const subtotal = lines.reduce((acc, line) => acc + (line.basePrice * line.quantity), 0);
  const lineDiscountsTotal = lines.reduce((acc, line) => {
    const gross = line.basePrice * line.quantity;
    if (line.discountType === 'FIXED') {
      return acc + Math.min(gross, line.discountValue || 0);
    }
    return acc + (gross * ((line.discountValue || line.discountPct || 0) / 100));
  }, 0);
  const totalAfterLines = Math.max(0, subtotal - lineDiscountsTotal);
  const cartDiscountAmt = globalDiscountType === 'FIXED'
    ? Math.min(totalAfterLines, globalDiscountValue || 0)
    : totalAfterLines * ((globalDiscountValue || 0) / 100);
  const grandTotal = Math.max(0, totalAfterLines - cartDiscountAmt);

  const mutation = useMutation({
    mutationFn: async (data: { status: 'QUOTATION' | 'CONFIRMED' | 'PENDING_PAYMENT' }) => {
      const linesPayload = lines.map(l => ({
        variantId: l.variantId,
        categoryId: 'default',
        quantity: l.quantity,
        unitPriceOverride: l.basePrice,
        customUnitPrice: l.basePrice,
        discountType: l.discountType,
        discountValue: l.discountValue,
        discountPct: l.discountPct,
        supervisorApprovalToken: l.supervisorApprovalToken,
      }));

      if (isEditing && saleIdToEdit) {
        return salesApi.updateQuotation(saleIdToEdit, {
          warehouseId: warehouseId || undefined,
          customerId: customerId || null,
          paymentMethod,
          posGrandTotal: grandTotal,
          cartDiscountTotal: cartDiscountAmt,
          globalDiscountType,
          globalDiscountValue,
          lines: linesPayload,
        });
      }

      const payload = {
        id: generateUUID(),
        branchId,
        warehouseId,
        customerId: customerId || undefined,
        source: 'BACKOFFICE',
        paymentMethod,
        status: data.status,
        posGrandTotal: grandTotal,
        createdAtIso: new Date().toISOString(),
        cartDiscountTotal: cartDiscountAmt,
        globalDiscountType,
        globalDiscountValue,
        supervisorApprovalToken: globalSupervisorToken,
        lines: linesPayload,
      };
      return salesApi.createSale(payload as any);
    },
    onSuccess: (_, variables) => {
      if (isEditing) {
        toast.success('Presupuesto actualizado');
        if (saleIdToEdit) {
          queryClient.invalidateQueries({ queryKey: queryKeys.sales.detail(saleIdToEdit) });
        }
      } else {
        const messages = {
          QUOTATION: 'Presupuesto creado con éxito',
          CONFIRMED: 'Venta Confirmada',
          PENDING_PAYMENT: 'Venta registrada con pago pendiente',
        };
        toast.success(messages[variables.status]);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.sales.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.finance.currentAccounts() });
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all() });
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || err.message || 'Error al procesar la operación'),
  });

  const handleSave = (status: 'QUOTATION' | 'CONFIRMED' | 'PENDING_PAYMENT') => {
    if (!branchId) { toast.error('Debe seleccionar una sucursal origen'); return; }
    if (lines.length === 0) { toast.error('Agregue al menos un artículo'); return; }
    mutation.mutate({ status });
  };

  const results = searchResults as any[];
  const isBusy = mutation.isPending || (isEditing && isLoadingEdit);

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Presupuesto' : 'Nueva Venta / Presupuesto'}
      onClose={onClose}
      width="xl"
      footer={
        <div className={styles.footerBetween}>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <div className={styles.footerActions}>
            {isEditing ? (
              <Button variant="primary" onClick={() => handleSave('QUOTATION')} loading={mutation.isPending} disabled={isBusy}>
                Guardar cambios
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={() => handleSave('QUOTATION')} loading={mutation.isPending}>Guardar como Presupuesto</Button>
                <Button variant="outline" onClick={() => handleSave('PENDING_PAYMENT')} loading={mutation.isPending}>Guardar con Pago Pendiente</Button>
                <Button variant="primary" onClick={() => handleSave('CONFIRMED')} loading={mutation.isPending}>Confirmar Venta</Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className={styles.stack}>
        
        {/* Cabecera */}
        <div className={styles.headerFields}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Sucursal Emisora *</label>
            <select
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              className={styles.fieldSelect}
              disabled={isEditing}
            >
              <option value="">Seleccionar Sucursal...</option>
              {branchesData?.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Depósito / Stock *</label>
            <select 
              value={warehouseId} 
              onChange={e => setWarehouseId(e.target.value)} 
              disabled={!branchId}
              className={clsx(styles.fieldSelect, !branchId && styles.fieldSelectDisabled)}
            >
              <option value="">Seleccionar Depósito...</option>
              {(selectedBranch as any)?.warehouses?.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Cliente (Opcional)</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={styles.fieldSelect}>
              <option value="">Consumidor Final</option>
              {customersData?.data.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Forma de Pago</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className={styles.fieldSelect}>
              <option value="CASH">Efectivo</option>
              <option value="CREDIT_CARD">Tarjeta (Débito/Crédito)</option>
              <option value="BANK_TRANSFER">Transferencia</option>
              <option value="CUSTOMER_CREDIT">Cuenta Corriente</option>
            </select>
          </div>
        </div>

        {/* Buscador de Productos */}
        <div className={styles.cartPanel}>
          <h4 className={styles.cartTitle}>
            <Calculator size={16} /> Detalle del Carrito
          </h4>
          
          <div className={styles.searchRow}>
            <div className={styles.searchWrap} ref={searchRef}>
              <label className={styles.searchLabel}>
                Buscar Producto
              </label>
              <div className={styles.searchInputWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Nombre, SKU, código de barras, color, marca..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  className={styles.searchInput}
                />
              </div>

              {showDropdown && searchQuery.trim().length >= 2 && (
                <div className={styles.dropdown}>
                  {isSearching ? (
                    <div className={styles.dropdownEmpty}>
                      Buscando...
                    </div>
                  ) : results && results.length > 0 ? (
                    results.map((v: any) => (
                      <div
                        key={v.id}
                        onClick={() => handleSelectProduct(v)}
                        className={styles.dropdownItem}
                      >
                        <div>
                          <div className={styles.productName}>
                            {v.product?.name || 'Producto'} 
                            {v.size && <span className={styles.productVariant}>Talle {v.size}</span>}
                            {v.color && <span className={styles.productVariant}>{v.color}</span>}
                          </div>
                          <div className={styles.productMeta}>
                            <span>SKU: <strong className={styles.productSku}>{v.sku}</strong></span>
                            {v.product?.brand?.name && <span>· {v.product.brand.name}</span>}
                            {v.product?.category?.name && <span>· {v.product.category.name}</span>}
                          </div>
                        </div>
                        <div className={styles.productAside}>
                          <div className={styles.productPrice}>{formatCurrency(v.basePrice)}</div>
                          {v.stockLevels?.length > 0 && (
                            <div className={styles.stockRow}>
                              <Package size={10} />
                              Stock: {v.stockLevels.reduce((a: number, s: any) => a + s.availableQuantity, 0)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.dropdownEmpty}>
                      No se encontraron productos para "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.qtyCol}>
              <Input label="Cant." type="number" min="1" value={qtyInput} onChange={e => setQtyInput(Number(e.target.value))} />
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.linesTable}>
              <thead>
                <tr>
                  <th className={styles.linesTh}>Producto</th>
                  <th className={styles.linesTh}>Precio U. ($)</th>
                  <th className={styles.linesTh}>Cant.</th>
                  <th className={styles.linesTh}>Desc.</th>
                  <th className={styles.linesTh}>Total L.</th>
                  <th className={styles.linesTh}></th>
                </tr>
              </thead>
              <tbody>
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.linesEmpty}>
                      Buscá un producto arriba para agregarlo al carrito
                    </td>
                  </tr>
                )}
                {lines.map((l, i) => {
                  const lineDiscountAmt = l.discountType === 'FIXED'
                    ? Math.min(l.basePrice * l.quantity, l.discountValue || 0)
                    : (l.basePrice * l.quantity) * ((l.discountValue || l.discountPct || 0) / 100);
                  const lineTotal = Math.max(0, (l.basePrice * l.quantity) - lineDiscountAmt);

                  return (
                    <tr key={i}>
                      <td className={styles.linesTd}>
                        <div className={styles.lineName}>{l.variantName}</div>
                        <div className={styles.lineSku}>{l.variantSku}</div>
                      </td>
                      <td className={styles.linesTd}>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={l.basePrice}
                          onChange={e => updateLine(i, 'basePrice', Number(e.target.value))}
                          className={styles.inputPrice}
                        />
                      </td>
                      <td className={styles.linesTd}>
                        <input
                          type="number"
                          min="1"
                          value={l.quantity}
                          onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                          className={styles.inputQty}
                        />
                      </td>
                      <td className={styles.linesTd}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <input
                            type="number"
                            min="0"
                            max={l.discountType === 'PERCENTAGE' ? 100 : l.basePrice * l.quantity}
                            value={l.discountValue || ''}
                            placeholder="0"
                            onChange={e => updateLine(i, 'discountValue', Number(e.target.value))}
                            disabled={!allowManualDiscount}
                            title={!allowManualDiscount ? 'Descuentos manuales deshabilitados' : ''}
                            className={clsx(styles.inputDiscount, !allowManualDiscount && styles.inputDiscountDisabled)}
                            style={{ width: '55px' }}
                          />
                          <button
                            type="button"
                            onClick={() => updateLine(i, 'discountType', l.discountType === 'PERCENTAGE' ? 'FIXED' : 'PERCENTAGE')}
                            style={{
                              padding: '2px 4px',
                              fontSize: '0.75rem',
                              borderRadius: '4px',
                              border: '1px solid var(--color-border-subtle, #cbd5e1)',
                              background: '#f8fafc',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            {l.discountType === 'FIXED' ? '$' : '%'}
                          </button>
                        </div>
                      </td>
                      <td className={clsx(styles.linesTd, styles.lineTotal)}>
                        {formatCurrency(lineTotal)}
                      </td>
                      <td className={clsx(styles.linesTd, styles.removeCell)}>
                        <X size={16} color="var(--red)" className={styles.removeBtn} onClick={() => removeLine(i)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen de Totales */}
        <div className={styles.totalsPanel}>
          <div className={styles.totalsRow}>
            <span>Subtotal Bruto:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {lineDiscountsTotal > 0 && (
            <div className={styles.totalsRowDiscount}>
              <span>Descuentos por Línea:</span>
              <span>- {formatCurrency(lineDiscountsTotal)}</span>
            </div>
          )}
          <div className={styles.totalsDiscountRow}>
            <span className={styles.discountLabel}>
              <Tag size={14} /> Descuento Global:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                min="0"
                max={globalDiscountType === 'PERCENTAGE' ? 100 : totalAfterLines}
                value={globalDiscountValue || ''}
                placeholder="0"
                onChange={e => {
                  const val = Number(e.target.value);
                  if (val > 0 && !hasDiscountPermission && !globalSupervisorToken) {
                    setPendingSupervisorAction({
                      action: 'apply:Discount',
                      label: 'Aplicar Descuento Global',
                      onApproved: (res) => {
                        setGlobalSupervisorToken(res.supervisorApprovalToken);
                        setGlobalDiscountValue(val);
                      },
                    });
                    setSupervisorModalOpen(true);
                  } else {
                    setGlobalDiscountValue(val);
                  }
                }}
                disabled={!allowManualDiscount}
                title={!allowManualDiscount ? 'Descuentos manuales deshabilitados' : ''}
                className={clsx(styles.discountInput, !allowManualDiscount && styles.discountInputDisabled)}
                style={{ width: '70px' }}
              />
              <button
                type="button"
                onClick={() => setGlobalDiscountType(t => t === 'PERCENTAGE' ? 'FIXED' : 'PERCENTAGE')}
                style={{
                  padding: '3px 6px',
                  fontSize: '0.8rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-subtle, #cbd5e1)',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {globalDiscountType === 'FIXED' ? '$ Monto' : '% Pct'}
              </button>
            </div>
          </div>
          <div className={styles.grandTotal}>
            <span>Total Neto:</span>
            <span className={styles.grandTotalValue}>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

      </div>

      {pendingSupervisorAction && (
        <SupervisorApprovalModal
          open={supervisorModalOpen}
          onClose={() => setSupervisorModalOpen(false)}
          action={pendingSupervisorAction.action}
          actionLabel={pendingSupervisorAction.label}
          onApproved={(res) => {
            pendingSupervisorAction.onApproved(res);
            setSupervisorModalOpen(false);
          }}
        />
      )}
    </Drawer>
  );
}
