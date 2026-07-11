import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Truck, Trash2, Plus, Minus, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

import { purchasesApi } from '@/api/purchases.api';
import { queryKeys } from '@/api/queryKeys';
import { apiClient } from '@/api/client';
import type { ProductVariant } from '@/types';
import { formatCurrency } from '@/utils/formatCurrency';
import { Button, Input, Drawer } from '@/components/ui';
import adminStyles from '@/styles/AdminListShared.module.css';
import styles from './NewPurchasePage.module.css';

export default function NewPurchasePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const [search, setSearch] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [cart, setCart] = useState<{ variant: ProductVariant, qty: number, cost: number, discount: number }[]>([]);
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [notes, setNotes] = useState('');

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['catalog', 'search', search],
    queryFn: () => purchasesApi.searchCatalog(search),
    enabled: search.length >= 3,
  });

  const handleAddToCart = (variant: ProductVariant) => {
    setCart(prev => {
      const exists = prev.find(i => i.variant.id === variant.id);
      if (exists) {
        return prev.map(i => i.variant.id === variant.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { variant, qty: 1, cost: variant.costPrice, discount: 0 }];
    });
    setSearch('');
    searchInputRef.current?.focus();
  };

  const updateLine = (id: string, field: 'qty' | 'cost' | 'discount', value: number) => {
    setCart(prev => prev.map(i => {
      if (i.variant.id === id) {
        return { ...i, [field]: value };
      }
      return i;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.cost * item.qty), 0);
  const totalDiscount = cart.reduce((acc, item) => acc + (item.discount || 0), 0);
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
    if (cart.length === 0) return toast.error('El carrito está vacío');
    setPaymentModalOpen(true);
    setPaymentAmount(total);
  };

  return (
    <div className={styles.shell}>
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <button type="button" onClick={() => navigate(-1)} className={styles.backBtn} aria-label="Volver">
            <ArrowLeft />
          </button>
          <h2 className={styles.pageTitle}>Nueva Compra de Mercadería</h2>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
          <Button variant="primary" icon={<Save size={18} />} onClick={handleSave}>Procesar Compra</Button>
        </div>
      </div>

      <div className={styles.body}>
        <div className={styles.searchPane}>
          <div className={styles.searchHeader}>
            <div className={styles.searchWrap}>
              <Search size={20} className={styles.searchIcon} />
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Buscar productos en el catálogo por nombre, SKU o código..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.resultsArea}>
            {search.length < 3 ? (
              <div className={styles.emptySearch}>
                <div>
                  <Truck size={64} className={styles.emptyIcon} />
                  <p>Buscá los artículos que recibiste para agregarlos a la compra.</p>
                </div>
              </div>
            ) : isSearching ? (
              <div>Cargando catálogo...</div>
            ) : searchResults?.length > 0 ? (
              <div className={styles.productGrid}>
                {searchResults.map((p: ProductVariant & { name?: string; size?: string }) => (
                  <div key={p.id} onClick={() => handleAddToCart(p)} className={styles.productCard} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handleAddToCart(p)}>
                    <p className={styles.productSku}>{p.sku}</p>
                    <p className={styles.productName}>{p.name} {p.size && `(${p.size})`}</p>
                    <p className={styles.productPrice}>{formatCurrency(p.costPrice)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No se encontraron productos.</p>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.sidebarForm}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="supplier-select">Proveedor</label>
              <select 
                id="supplier-select"
                value={selectedSupplierId} 
                onChange={e => setSelectedSupplierId(e.target.value)}
                className={styles.fieldSelect}
              >
                <option value="">-- Seleccionar Proveedor --</option>
                {(suppliers?.data || []).map((s: { id: string; companyName: string }) => (
                  <option key={s.id} value={s.id}>{s.companyName}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="warehouse-select">Destino (Depósito)</label>
              <select 
                id="warehouse-select"
                value={selectedWarehouseId} 
                onChange={e => setSelectedWarehouseId(e.target.value)}
                className={styles.fieldSelect}
              >
                <option value="">-- Seleccionar Depósito --</option>
                {(warehouses?.data || warehouses || []).map((w: { id: string; name: string }) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.cartArea}>
            {cart.length === 0 ? (
              <div className={styles.emptyCart}>
                <ShoppingCart size={32} className={styles.emptyCartIcon} />
                <p>Carrito de compra vacío</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.variant.id} className={styles.cartItem}>
                  <div className={styles.cartItemHeader}>
                    <span className={styles.cartSku}>{item.variant.sku}</span>
                    <Trash2
                      size={16}
                      color="var(--red)"
                      className={styles.deleteIcon}
                      onClick={() => setCart(c => c.filter(i => i.variant.id !== item.variant.id))}
                    />
                  </div>
                  
                  <div className={styles.cartGrid}>
                    <div>
                      <label className={styles.miniLabel}>Cantidad</label>
                      <div className={styles.qtyRow}>
                        <Button variant="secondary" size="sm" onClick={() => updateLine(item.variant.id, 'qty', Math.max(1, item.qty - 1))}><Minus size={12}/></Button>
                        <span className={styles.qtyValue}>{item.qty}</span>
                        <Button variant="secondary" size="sm" onClick={() => updateLine(item.variant.id, 'qty', item.qty + 1)}><Plus size={12}/></Button>
                      </div>
                    </div>
                    <div>
                      <label className={styles.miniLabel}>Costo Unitario ($)</label>
                      <input 
                        type="number" 
                        value={item.cost} 
                        onChange={e => updateLine(item.variant.id, 'cost', Number(e.target.value))}
                        className={styles.costInput}
                      />
                    </div>
                  </div>

                  <div className={styles.cartFooter}>
                    <div className={styles.discountRow}>
                      <label className={styles.miniLabel}>Desc. ($)</label>
                      <input 
                        type="number" 
                        value={item.discount} 
                        onChange={e => updateLine(item.variant.id, 'discount', Number(e.target.value))}
                        className={styles.discountInput}
                      />
                    </div>
                    <span className={styles.lineTotal}>{formatCurrency((item.cost * item.qty) - item.discount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={styles.totalsPanel}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabelMuted}>Subtotal</span>
              <span className={styles.totalValue}>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.totalRowDiscount}>
              <span>Descuentos</span>
              <span>- {formatCurrency(totalDiscount)}</span>
            </div>
            <div className={styles.totalRowFinal}>
              <span className={styles.totalLabel}>Total Compra</span>
              <span className={styles.totalValueLg}>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <Drawer open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Confirmar Compra y Pago" width="sm">
        <div className={styles.drawerStack}>
          <div className={styles.paymentHero}>
            <p className={styles.paymentHeroLabel}>Total Facturado</p>
            <h1 className={styles.paymentHeroValue}>{formatCurrency(total)}</h1>
          </div>

          <div className={styles.drawerField}>
            <label className={styles.drawerLabel} htmlFor="payment-account">Cuenta de Origen (Pago)</label>
            <select 
              id="payment-account"
              value={paymentAccountId} 
              onChange={e => setPaymentAccountId(e.target.value)}
              className={styles.drawerSelect}
            >
              <option value="">-- No pagar ahora (Deuda) --</option>
              {(accounts?.data || accounts || []).map((a: { id: string; name: string; balance: number }) => (
                <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
              ))}
            </select>
          </div>

          {paymentAccountId && (
            <div className={styles.drawerField}>
              <label className={styles.drawerLabel} htmlFor="payment-amount">Monto a Pagar ($)</label>
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
                lines: cart.map(i => ({
                  variantId: i.variant.id,
                  quantity: i.qty,
                  unitCost: i.cost,
                  discountAmount: i.discount
                }))
              })}
            >
              Generar Orden y Pago
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
