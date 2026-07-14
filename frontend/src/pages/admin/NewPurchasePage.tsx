import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

import { purchasesApi } from '@/api/purchases.api';
import { queryKeys } from '@/api/queryKeys';
import { apiClient } from '@/api/client';
import { formatCurrency } from '@/utils/formatCurrency';
import { Button, PageContainer } from '@/components/ui';
import { PurchaseCatalogSearch, type PurchaseCatalogHit } from '@/features/purchasing/components/PurchaseCatalogSearch';
import { PurchaseSelectedLines, type PurchaseLineDraft } from '@/features/purchasing/components/PurchaseSelectedLines';
import { PurchasePaymentDrawer, type PurchasePaymentPayload } from '@/features/purchasing/components/PurchasePaymentDrawer';
import drawerStyles from '@/styles/DetailDrawerShared.module.css';
import styles from './NewPurchasePage.module.css';

export default function NewPurchasePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: suppliers } = useQuery({
    queryKey: queryKeys.suppliers.all(),
    queryFn: () => purchasesApi.getSuppliers(),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => apiClient.get('/warehouses').then(res => res.data),
  });

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [lines, setLines] = useState<PurchaseLineDraft[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const handleAddToCart = (product: PurchaseCatalogHit) => {
    const label = `${product.name}${product.size ? ` (${product.size})` : ''}${product.color ? ` · ${product.color}` : ''}`;
    setLines(prev => {
      const exists = prev.find(i => i.variantId === product.id);
      if (exists) {
        return prev.map(i => i.variantId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
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

  const linesSubtotal = lines.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
  const lineDiscounts = lines.reduce((acc, item) => acc + (item.discount || 0), 0);
  const afterLineDiscounts = linesSubtotal - lineDiscounts;
  const total = Math.max(0, afterLineDiscounts - (discountAmount || 0) + (shippingCost || 0));

  const purchaseMutation = useMutation({
    mutationFn: (data: unknown) => purchasesApi.processDirect(data),
    onSuccess: () => {
      toast.success('Compra registrada correctamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all() });
      navigate('/admin/purchasing');
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al procesar compra'),
  });

  const handleSave = () => {
    if (!selectedSupplierId) return toast.error('Seleccioná un proveedor');
    if (!selectedWarehouseId) return toast.error('Seleccioná un depósito');
    if (lines.length === 0) return toast.error('El carrito está vacío');
    if (discountAmount > afterLineDiscounts) return toast.error('El descuento no puede superar el subtotal');
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = (payload: PurchasePaymentPayload) => {
    purchaseMutation.mutate({
      supplierId: selectedSupplierId,
      warehouseId: selectedWarehouseId,
      paymentAccountId: payload.paymentAccountId,
      paymentAmount: payload.paymentAmount,
      paymentReference: payload.paymentReference,
      notes: payload.notes,
      discountAmount,
      shippingCost,
      lines: lines.map(i => ({
        variantId: i.variantId,
        quantity: i.quantity,
        unitCost: i.unitCost,
        discountAmount: i.discount,
      })),
    });
  };

  return (
    <PageContainer
      title="Nueva compra de mercadería"
      subtitle="Ingreso directo: buscá artículos, cargá cantidades y registrá pago o deuda."
      action={
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button variant="primary" icon={<Save size={18} />} onClick={handleSave}>Procesar compra</Button>
        </div>
      }
    >
      <div className={styles.pageShell}>
        <div className={drawerStyles.purchaseForm}>
          <PurchaseCatalogSearch
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

          <div className={drawerStyles.purchaseSidebar}>
            <div className={drawerStyles.configPanel}>
              <h3 className={drawerStyles.configPanelTitle}>Configuración de ingreso</h3>
              <div className={drawerStyles.fieldGroupSm}>
                <label className={drawerStyles.selectLabel}>Proveedor *</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className={drawerStyles.select}
                >
                  <option value="">Seleccionar Proveedor...</option>
                  {(suppliers?.data || []).map((s: { id: string; companyName: string }) => (
                    <option key={s.id} value={s.id}>{s.companyName}</option>
                  ))}
                </select>
              </div>

              <div className={drawerStyles.fieldGroupSm}>
                <label className={drawerStyles.selectLabel}>Destino (Depósito) *</label>
                <select
                  value={selectedWarehouseId}
                  onChange={e => setSelectedWarehouseId(e.target.value)}
                  className={drawerStyles.select}
                >
                  <option value="">Seleccionar Depósito...</option>
                  {(warehouses?.data || warehouses || []).map((w: { id: string; name: string }) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className={drawerStyles.extrasGrid}>
                <div>
                  <label className={drawerStyles.inputLabelSm}>Desc. orden ($)</label>
                  <div className={drawerStyles.costInputWrap}>
                    <span className={drawerStyles.costPrefix}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountAmount}
                      onChange={e => setDiscountAmount(Number(e.target.value))}
                      className={`${drawerStyles.inputSm} ${drawerStyles.inputSmWithPrefix}`}
                    />
                  </div>
                </div>
                <div>
                  <label className={drawerStyles.inputLabelSm}>Envío / flete ($)</label>
                  <div className={drawerStyles.costInputWrap}>
                    <span className={drawerStyles.costPrefix}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingCost}
                      onChange={e => setShippingCost(Number(e.target.value))}
                      className={`${drawerStyles.inputSm} ${drawerStyles.inputSmWithPrefix}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={drawerStyles.cartPanel}>
              <div className={drawerStyles.cartGrandTotal}>
                <div className={styles.totalMeta}>
                  <span>Subtotal {formatCurrency(linesSubtotal)}</span>
                </div>
                {(lineDiscounts > 0 || discountAmount > 0) && (
                  <div className={styles.totalMeta}>
                    <span className={styles.discountMeta}>
                      Descuentos - {formatCurrency(lineDiscounts + discountAmount)}
                    </span>
                  </div>
                )}
                {shippingCost > 0 && (
                  <div className={styles.totalMeta}>
                    <span>Envío {formatCurrency(shippingCost)}</span>
                  </div>
                )}
                <span className={drawerStyles.cartGrandTotalLabel}>Total compra</span>
                <span className={drawerStyles.cartGrandTotalValue}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PurchasePaymentDrawer
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        totalAmount={total}
        loading={purchaseMutation.isPending}
        confirmLabel="Generar orden y pago"
        onConfirm={handleConfirmPayment}
      />
    </PageContainer>
  );
}
