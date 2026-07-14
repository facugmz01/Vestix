import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

import { purchasesApi } from '@/api/purchases.api';
import { queryKeys } from '@/api/queryKeys';
import { apiClient } from '@/api/client';
import { formatCurrency } from '@/utils/formatCurrency';
import { Button, Input, Drawer, PageContainer } from '@/components/ui';
import { PurchaseCatalogSearch, type PurchaseCatalogHit } from '@/features/purchasing/components/PurchaseCatalogSearch';
import drawerStyles from '@/styles/DetailDrawerShared.module.css';
import styles from './NewPurchasePage.module.css';

type Line = { variantId: string; variantSku: string; quantity: number; unitCost: number; discount: number };

export default function NewPurchasePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: suppliers } = useQuery({
    queryKey: queryKeys.suppliers.all(),
    queryFn: () => purchasesApi.getSuppliers(),
  });

  const { data: accounts } = useQuery({
    queryKey: ['treasury', 'accounts'],
    queryFn: () => apiClient.get('/finance/treasury/accounts').then(res => res.data),
  });

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => apiClient.get('/warehouses').then(res => res.data),
  });

  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [lines, setLines] = useState<Line[]>([]);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [notes, setNotes] = useState('');

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

  const updateLine = (idx: number, field: 'quantity' | 'unitCost' | 'discount', value: number) => {
    setLines(prev => prev.map((line, i) => {
      if (i !== idx) return line;
      if (field === 'quantity' && value < 1) return line;
      if ((field === 'unitCost' || field === 'discount') && value < 0) return line;
      return { ...line, [field]: value };
    }));
  };

  const subtotal = lines.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);
  const totalDiscount = lines.reduce((acc, item) => acc + (item.discount || 0), 0);
  const total = subtotal - totalDiscount;

  const purchaseMutation = useMutation({
    mutationFn: (data: unknown) => purchasesApi.processDirect(data),
    onSuccess: () => {
      toast.success('Compra registrada correctamente');
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all() });
      navigate('/admin/purchasing');
    },
    onError: (err: { message?: string }) => toast.error(err.message || 'Error al procesar compra'),
  });

  const handleSave = () => {
    if (!selectedSupplierId) return toast.error('Seleccioná un proveedor');
    if (!selectedWarehouseId) return toast.error('Seleccioná un depósito');
    if (lines.length === 0) return toast.error('El carrito está vacío');
    setPaymentModalOpen(true);
    setPaymentAmount(total);
  };

  return (
    <PageContainer
      title="Nueva compra de mercadería"
      subtitle="Ingreso directo al stock: buscá artículos, cargá costos y registrá la recepción."
      action={
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button variant="primary" icon={<Save size={18} />} onClick={handleSave}>Procesar compra</Button>
        </div>
      }
    >
      <div className={styles.pageShell}>
        <div className={drawerStyles.purchaseForm}>
          <PurchaseCatalogSearch autoFocus onSelect={handleAddToCart} />

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
            </div>

            <div className={drawerStyles.cartPanel}>
              <h3 className={drawerStyles.cartPanelTitle}>Artículos Agregados ({lines.length})</h3>

              <div className={drawerStyles.cartScroll}>
                {lines.length === 0 && (
                  <p className={drawerStyles.cartEmptyHint}>No hay artículos en la compra.</p>
                )}
                {lines.map((l, i) => (
                  <div key={`${l.variantId}-${i}`} className={drawerStyles.cartLineCard}>
                    <div className={drawerStyles.cartLineHeader}>
                      <span className={drawerStyles.selectLabel}>{l.variantSku}</span>
                      <X
                        size={16}
                        color="var(--red)"
                        className={drawerStyles.clickable}
                        onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))}
                      />
                    </div>
                    <div className={drawerStyles.cartLineGrid3}>
                      <div>
                        <label className={drawerStyles.inputLabelSm}>Cant.</label>
                        <input
                          type="number"
                          min="1"
                          value={l.quantity}
                          onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                          className={drawerStyles.inputSm}
                        />
                      </div>
                      <div>
                        <label className={drawerStyles.inputLabelSm}>Costo U.</label>
                        <div className={drawerStyles.costInputWrap}>
                          <span className={drawerStyles.costPrefix}>$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={l.unitCost}
                            onChange={e => updateLine(i, 'unitCost', Number(e.target.value))}
                            className={`${drawerStyles.inputSm} ${drawerStyles.inputSmWithPrefix}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={drawerStyles.inputLabelSm}>Desc.</label>
                        <div className={drawerStyles.costInputWrap}>
                          <span className={drawerStyles.costPrefix}>$</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={l.discount}
                            onChange={e => updateLine(i, 'discount', Number(e.target.value))}
                            className={`${drawerStyles.inputSm} ${drawerStyles.inputSmWithPrefix}`}
                          />
                        </div>
                      </div>
                    </div>
                    <div className={drawerStyles.cartLineTotal}>
                      {formatCurrency((l.unitCost * l.quantity) - l.discount)}
                    </div>
                  </div>
                ))}
              </div>

              <div className={drawerStyles.cartGrandTotal}>
                <div className={styles.totalMeta}>
                  <span>Subtotal {formatCurrency(subtotal)}</span>
                  {totalDiscount > 0 && <span className={styles.discountMeta}>- {formatCurrency(totalDiscount)}</span>}
                </div>
                <span className={drawerStyles.cartGrandTotalLabel}>Total compra</span>
                <span className={drawerStyles.cartGrandTotalValue}>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Drawer open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Confirmar compra y pago" width="sm">
        <div className={styles.drawerStack}>
          <div className={styles.paymentHero}>
            <p className={styles.paymentHeroLabel}>Total facturado</p>
            <h1 className={styles.paymentHeroValue}>{formatCurrency(total)}</h1>
          </div>

          <div className={styles.drawerField}>
            <label className={styles.drawerLabel} htmlFor="payment-account">Cuenta de origen (pago)</label>
            <select
              id="payment-account"
              value={paymentAccountId}
              onChange={e => setPaymentAccountId(e.target.value)}
              className={styles.drawerSelect}
            >
              <option value="">No pagar ahora (deuda)</option>
              {(accounts?.data || accounts || []).map((a: { id: string; name: string; balance: number }) => (
                <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
              ))}
            </select>
          </div>

          {paymentAccountId && (
            <div className={styles.drawerField}>
              <label className={styles.drawerLabel} htmlFor="payment-amount">Monto a pagar ($)</label>
              <Input
                id="payment-amount"
                type="number"
                max={total}
                value={paymentAmount}
                onChange={e => setPaymentAmount(Number(e.target.value))}
                className={styles.paymentInputLg}
              />
              <p className={styles.hintText}>
                Si pagás menos del total, la diferencia se cargará como deuda al proveedor.
              </p>
            </div>
          )}

          {!paymentAccountId && (
            <div className={styles.debtAlert}>
              <strong>Atención:</strong> Se generará una deuda de <strong>{formatCurrency(total)}</strong> con el proveedor.
            </div>
          )}

          <div className={styles.drawerField}>
            <label className={styles.drawerLabel} htmlFor="payment-notes">Observaciones</label>
            <textarea
              id="payment-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Factura A nro 0001-..."
              className={styles.drawerTextarea}
            />
          </div>

          <div className={styles.drawerFooter}>
            <Button
              variant="primary"
              className={styles.submitBtnFull}
              loading={purchaseMutation.isPending}
              onClick={() => purchaseMutation.mutate({
                supplierId: selectedSupplierId,
                warehouseId: selectedWarehouseId,
                branchId: 'main',
                paymentAccountId,
                paymentAmount,
                notes,
                lines: lines.map(i => ({
                  variantId: i.variantId,
                  quantity: i.quantity,
                  unitCost: i.unitCost,
                  discountAmount: i.discount,
                })),
              })}
            >
              Generar orden y pago
            </Button>
          </div>
        </div>
      </Drawer>
    </PageContainer>
  );
}
