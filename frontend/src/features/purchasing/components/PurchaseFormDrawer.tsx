import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer, Button, Input } from '@/components/ui';
import { purchasesApi } from '@/api/purchases.api';
import { suppliersApi } from '@/api/suppliers.api';
import { apiClient } from '@/api/client';
import { queryKeys } from '@/api/queryKeys';
import type { PurchaseOrder } from '@/types';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from '@/styles/DetailDrawerShared.module.css';
import { PurchaseCatalogSearch, type PurchaseCatalogHit } from './PurchaseCatalogSearch';
import { PurchaseSelectedLines, type PurchaseLineDraft } from './PurchaseSelectedLines';

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
  const [lines, setLines] = useState<PurchaseLineDraft[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');

  const { data: suppliersData } = useQuery({
    queryKey: queryKeys.suppliers.all(),
    queryFn: () => suppliersApi.getSuppliers({}),
    enabled: open,
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => apiClient.get('/warehouses').then(res => res.data),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (orderToEdit) {
      setSupplierId(orderToEdit.supplierId);
      setDestinationWarehouseId(
        (orderToEdit as PurchaseOrder & { destinationWarehouseId?: string; warehouseId?: string }).destinationWarehouseId
        || (orderToEdit as PurchaseOrder & { warehouseId?: string }).warehouseId
        || '',
      );
      setExpectedDeliveryDate(orderToEdit.expectedDeliveryDate ? orderToEdit.expectedDeliveryDate.split('T')[0] : '');
      setDiscountAmount(orderToEdit.discountAmount || 0);
      setShippingCost(orderToEdit.shippingCost || 0);
      setNotes(orderToEdit.notes || '');
      setLines(orderToEdit.lines.map(l => ({
        variantId: l.variantId,
        variantSku: l.variantSku || l.productName || l.variantId,
        quantity: l.orderedQuantity,
        unitCost: l.unitCost,
        discount: l.discountAmount || 0,
      })));
    } else {
      setSupplierId('');
      setDestinationWarehouseId('');
      setExpectedDeliveryDate('');
      setDiscountAmount(0);
      setShippingCost(0);
      setNotes('');
      setLines([]);
    }
  }, [open, orderToEdit]);

  const handleAddToCart = (product: PurchaseCatalogHit) => {
    const label = `${product.name}${product.size ? ` (${product.size})` : ''}${product.color ? ` · ${product.color}` : ''}`;
    setLines(prev => {
      const existing = prev.find(l => l.variantId === product.id);
      if (existing) {
        return prev.map(l => l.variantId === product.id ? { ...l, quantity: l.quantity + 1 } : l);
      }
      return [...prev, {
        variantId: product.id,
        variantSku: label,
        quantity: 1,
        unitCost: product.costPrice || 0,
        discount: 0,
      }];
    });
  };

  const linesSubtotal = lines.reduce((acc, line) => acc + (line.quantity * line.unitCost), 0);
  const lineDiscounts = lines.reduce((acc, line) => acc + (line.discount || 0), 0);
  const afterLineDiscounts = linesSubtotal - lineDiscounts;
  const total = Math.max(0, afterLineDiscounts - (discountAmount || 0) + (shippingCost || 0));

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof purchasesApi.createOrder>[0]) => {
      if (isEditing && orderToEdit) return purchasesApi.updateOrder(orderToEdit.id, data);
      return purchasesApi.createOrder(data);
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
    if (discountAmount > afterLineDiscounts) return toast.error('El descuento no puede superar el subtotal');

    mutation.mutate({
      supplierId,
      destinationWarehouseId: warehouseId,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
      discountAmount,
      shippingCost,
      notes: notes || undefined,
      lines: lines.map(l => ({
        variantId: l.variantId,
        orderedQuantity: l.quantity,
        unitCost: l.unitCost,
        discountAmount: l.discount || 0,
      })),
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
        <PurchaseCatalogSearch
          enabled={open}
          autoFocus
          selectedVariantIds={lines.map(l => l.variantId)}
          onSelect={handleAddToCart}
          priorityContent={
            <PurchaseSelectedLines
              lines={lines}
              showLineDiscount
              onChange={setLines}
            />
          }
        />

        <div className={styles.purchaseSidebar}>
          <div className={styles.configPanel}>
            <h3 className={styles.configPanelTitle}>Configuración de OC</h3>
            <div className={styles.fieldGroupSm}>
              <label className={styles.selectLabel}>Proveedor *</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={styles.select} required>
                <option value="">Seleccionar Proveedor...</option>
                {(suppliersData?.data || []).map((s: { id: string; companyName: string }) => (
                  <option key={s.id} value={s.id}>{s.companyName}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroupSm}>
              <label className={styles.selectLabel}>Destino (Depósito) *</label>
              <select value={warehouseId} onChange={e => setDestinationWarehouseId(e.target.value)} className={styles.select} required>
                <option value="">Seleccionar Depósito...</option>
                {(warehouses?.data || warehouses || []).map((w: { id: string; name: string }) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <Input
              label="Fecha de Entrega Esperada"
              type="date"
              value={expectedDeliveryDate}
              onChange={e => setExpectedDeliveryDate(e.target.value)}
            />

            <div className={styles.extrasGrid}>
              <div>
                <label className={styles.inputLabelSm}>Desc. orden ($)</label>
                <div className={styles.costInputWrap}>
                  <span className={styles.costPrefix}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountAmount}
                    onChange={e => setDiscountAmount(Number(e.target.value))}
                    className={`${styles.inputSm} ${styles.inputSmWithPrefix}`}
                  />
                </div>
              </div>
              <div>
                <label className={styles.inputLabelSm}>Envío / flete ($)</label>
                <div className={styles.costInputWrap}>
                  <span className={styles.costPrefix}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingCost}
                    onChange={e => setShippingCost(Number(e.target.value))}
                    className={`${styles.inputSm} ${styles.inputSmWithPrefix}`}
                  />
                </div>
              </div>
            </div>

            <div className={styles.fieldGroupSm}>
              <label className={styles.selectLabel}>Notas</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className={styles.notesTextarea}
                placeholder="Observaciones internas..."
                rows={2}
              />
            </div>
          </div>

          <div className={styles.cartPanel}>
            <div className={styles.cartGrandTotal}>
              <div className={styles.totalsBreakdown}>
                <div className={styles.totalsRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(linesSubtotal)}</span>
                </div>
                {(lineDiscounts > 0 || discountAmount > 0) && (
                  <div className={`${styles.totalsRow} ${styles.totalsDiscount}`}>
                    <span>Descuentos</span>
                    <span>- {formatCurrency(lineDiscounts + discountAmount)}</span>
                  </div>
                )}
                {shippingCost > 0 && (
                  <div className={styles.totalsRow}>
                    <span>Envío</span>
                    <span>{formatCurrency(shippingCost)}</span>
                  </div>
                )}
              </div>
              <span className={styles.cartGrandTotalLabel}>Monto Total OC</span>
              <span className={styles.cartGrandTotalValue}>{formatCurrency(total)}</span>
              <p className={styles.paymentNoteHint}>
                Al emitir la orden vas a poder registrar el pago o dejarla en deuda.
              </p>
            </div>
          </div>
        </div>
      </form>
    </Drawer>
  );
}
