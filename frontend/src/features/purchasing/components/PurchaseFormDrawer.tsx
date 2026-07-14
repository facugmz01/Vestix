import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { purchasesApi } from '@/api/purchases.api';
import { suppliersApi } from '@/api/suppliers.api';
import { apiClient } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { PurchaseOrder } from '@/types';
import toast from 'react-hot-toast';
import { X, Search, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/styles/DetailDrawerShared.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
  orderToEdit?: PurchaseOrder | null;
}

export function PurchaseFormDrawer({ open, onClose, orderToEdit }: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!orderToEdit;

  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setDestinationWarehouseId] = useState('');
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
      setDestinationWarehouseId((orderToEdit as PurchaseOrder & { destinationWarehouseId?: string; warehouseId?: string }).destinationWarehouseId || (orderToEdit as PurchaseOrder & { warehouseId?: string }).warehouseId || '');
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

  const handleAddToCart = (product: { id: string; name: string; size?: string; costPrice?: number; sku: string }) => {
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

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => {
      const payload = { ...data, expectedDeliveryDate: (data.expectedDeliveryDate as string) || undefined };
      if (isEditing && orderToEdit) return purchasesApi.updateOrder(orderToEdit.id, payload);
      return purchasesApi.createOrder(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Orden actualizada (Borrador)' : 'Orden de compra creada');
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() });
      if (isEditing) queryClient.invalidateQueries({ queryKey: queryKeys.purchases.detail(orderToEdit!.id) });
      onClose();
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al guardar'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return toast.error('Seleccioná un proveedor');
    if (!warehouseId) return toast.error('Seleccioná un depósito de destino');
    if (lines.length === 0) return toast.error('Agregá al menos un artículo a la orden');
    
    mutation.mutate({
      supplierId,
      destinationWarehouseId: warehouseId,
      expectedDeliveryDate,
      lines: lines.map(l => ({ variantId: l.variantId, orderedQuantity: l.quantity, unitCost: l.unitCost })),
    });
  };

  return (
    <Drawer
      open={open}
      title={isEditing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra (Borrador)'}
      onClose={onClose}
      width="xl"
      fill
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={mutation.isPending}>Guardar Borrador</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className={styles.purchaseForm}>
        <div className={styles.purchaseMain}>
          <div className={styles.purchaseSearchWrap}>
            <Search size={18} className={styles.searchFieldIconLg} />
            <input
              type="text"
              placeholder="Buscar catálogo por SKU, nombre o categoría..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchFieldInputLg}
              autoFocus
            />
          </div>

          <div className={styles.purchaseScroll}>
            {search.length < 3 ? (
              <div className={styles.purchaseEmpty}>
                <Package size={48} className={styles.purchaseEmptyIcon} />
                <p>Escribí al menos 3 letras para buscar productos.</p>
              </div>
            ) : isSearching ? (
              <p className={styles.purchaseStatusMsg}>Buscando en catálogo...</p>
            ) : searchResults?.length > 0 ? (
              <div className={styles.productGrid}>
                {searchResults.map((p: { id: string; sku: string; name: string; size?: string; color?: string; basePrice?: number; costPrice?: number }) => (
                  <div
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className={styles.productCard}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddToCart(p)}
                  >
                    <p className={styles.productCardSku}>{p.sku}</p>
                    <p className={styles.productCardName}>
                      {p.name}
                      {p.size ? ` (${p.size})` : ''}
                      {p.color ? ` · ${p.color}` : ''}
                    </p>
                    <p className={styles.productCardPrice}>{formatCurrency(p.costPrice ?? p.basePrice ?? 0)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.purchaseStatusMsg}>No se encontraron resultados.</p>
            )}
          </div>
        </div>

        <div className={styles.purchaseSidebar}>
          <div className={styles.configPanel}>
            <h3 className={styles.configPanelTitle}>Configuración de OC</h3>
            <div className={styles.fieldGroupSm}>
              <label className={styles.selectLabel}>Proveedor *</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={styles.select} required>
                <option value="">Seleccionar Proveedor...</option>
                {(suppliersData?.data || []).map((s: { id: string; companyName: string }) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
              </select>
            </div>

            <div className={styles.fieldGroupSm}>
              <label className={styles.selectLabel}>Destino (Depósito) *</label>
              <select value={warehouseId} onChange={e => setDestinationWarehouseId(e.target.value)} className={styles.select} required>
                <option value="">Seleccionar Depósito...</option>
                {(warehouses?.data || warehouses || []).map((w: { id: string; name: string }) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            <Input
              label="Fecha de Entrega Esperada"
              type="date"
              value={expectedDeliveryDate}
              onChange={e => setExpectedDeliveryDate(e.target.value)}
            />
          </div>

          <div className={styles.cartPanel}>
            <h3 className={styles.cartPanelTitle}>Artículos Agregados ({lines.length})</h3>

            <div className={styles.cartScroll}>
              {lines.length === 0 && <p className={styles.cartEmptyHint}>No hay artículos en la orden.</p>}
              {lines.map((l, i) => (
                <div key={i} className={styles.cartLineCard}>
                  <div className={styles.cartLineHeader}>
                    <span className={styles.selectLabel}>{l.variantSku}</span>
                    <X size={16} color="var(--red)" className={styles.clickable} onClick={() => removeLine(i)} />
                  </div>
                  <div className={styles.cartLineGrid}>
                    <div>
                      <label className={styles.inputLabelSm}>Cant.</label>
                      <input type="number" min="1" value={l.quantity} onChange={(e) => updateLineQty(i, Number(e.target.value))} className={styles.inputSm} />
                    </div>
                    <div>
                      <label className={styles.inputLabelSm}>Costo U.</label>
                      <div className={styles.costInputWrap}>
                        <span className={styles.costPrefix}>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={l.unitCost}
                          onChange={(e) => updateLineCost(i, Number(e.target.value))}
                          className={`${styles.inputSm} ${styles.inputSmWithPrefix}`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.cartLineTotal}>
                    {formatCurrency(l.quantity * l.unitCost)}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.cartGrandTotal}>
              <span className={styles.cartGrandTotalLabel}>Monto Total OC</span>
              <span className={styles.cartGrandTotalValue}>{formatCurrency(totals)}</span>
            </div>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
