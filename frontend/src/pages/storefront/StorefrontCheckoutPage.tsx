import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Truck, Store, CreditCard, User, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { storefrontOrdersApi, type CheckoutDto } from '@/api/storefront-orders.api';
import { storefrontApi } from '@/api/storefront.api';
import { useCartStore } from '@/store/cart.store';
import { useOfflineQueueStore } from '@/store/offlineQueue.store';
import { useStorefrontAuthStore } from '@/store/storefrontAuth.store';
import { storePrefix } from '@/utils/storefrontDomain';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';
import { BankTransferDetails, hasBankTransferDetails, StorefrontStepper } from '@/components/storefront';
import styles from './storefrontCheckout.module.css';

export default function StorefrontCheckoutPage() {
  const navigate = useNavigate();
  const prefix = storePrefix();
  const queryClient = useQueryClient();
  const { items, totalPrice, clearCart } = useCartStore();
  const enqueueOfflineOp = useOfflineQueueStore(s => s.enqueue);
  const checkoutCompletedRef = useRef(false);

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['storefrontSettings', prefix],
    queryFn: () => storefrontApi.getSettings(),
  });

  const { customer, isAuthenticated } = useStorefrontAuthStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [info, setInfo] = useState({ firstName: '', lastName: '', email: '', phone: '', docType: 'DNI', docNum: '' });
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState({ street: '', city: '', state: '', zip: '' });
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [buyerCuit, setBuyerCuit] = useState('');

  const selectedShipping = settings?.shippingMethods?.find(m => m.id === shippingMethod);
  const selectedPayment = settings?.paymentMethods?.find(pm => pm.id === paymentMethod);
  const isBankTransfer = selectedPayment?.type === 'BANK_TRANSFER';
  const SHIPPING_COST = selectedShipping ? selectedShipping.price : 0;
  const subtotal = totalPrice();
  const grandTotal = subtotal + SHIPPING_COST;

  const mutation = useMutation({
    mutationFn: async (data: CheckoutDto) => {
      const orderId = data.id || crypto.randomUUID();
      const payload = { ...data, id: orderId };

      if (!navigator.onLine) {
        enqueueOfflineOp({
          module: 'STOREFRONT',
          action: 'checkout',
          description: `Pedido online offline por ${formatCurrency(grandTotal)}`,
          endpoint: '/storefront/checkout',
          method: 'POST',
          maxRetries: 5,
          payload
        });
        return { offline: true, orderId, payment: null };
      }

      try {
        const res = await storefrontOrdersApi.checkout(payload);
        return { offline: false, res, orderId, payment: (res as any).payment };
      } catch (err: any) {
        const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error');
        if (isNetworkError) {
          enqueueOfflineOp({
            module: 'STOREFRONT',
            action: 'checkout',
            description: `Pedido online offline por ${formatCurrency(grandTotal)}`,
            endpoint: '/storefront/checkout',
            method: 'POST',
            maxRetries: 5,
            payload
          });
          return { offline: true, orderId, payment: null };
        }
        throw err;
      }
    },
    onSuccess: (data: any) => {
      const orderId = data?.res?.id || data?.orderId || null;
      checkoutCompletedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['storefront'] });

      if (data?.payment?.initPoint) {
        clearCart();
        toast.success('Redirigiendo a Mercado Pago...');
        window.location.href = data.payment.initPoint;
        return;
      }

      clearCart();
      const paymentType = data?.payment?.method || selectedPayment?.type || '';
      const bankTransfer =
        data?.payment?.bankTransfer ||
        (paymentType === 'BANK_TRANSFER' && settings
          ? {
              transferCbu: settings.transferCbu,
              transferAlias: settings.transferAlias,
              transferHolderName: settings.transferHolderName,
              transferBankName: settings.transferBankName,
              transferCuit: settings.transferCuit,
            }
          : undefined);
      const params = new URLSearchParams();
      if (orderId) params.set('orderId', orderId);
      if (paymentType) params.set('payment', paymentType);
      if (buyerCuit) params.set('buyerCuit', buyerCuit);
      const query = params.toString();
      navigate(`${prefix}/checkout/success${query ? `?${query}` : ''}`, {
        replace: true,
        state: {
          paymentMethod: paymentType,
          bankTransfer,
          grandTotal,
        },
      });

      if (data?.offline) {
        toast.success('Pedido registrado fuera de línea (sincronizará cuando haya conexión) 💾');
      } else if (paymentType === 'BANK_TRANSFER') {
        toast.success('Pedido registrado. Transferí con los datos bancarios indicados.');
      } else {
        toast.success('¡Pedido registrado! ✅');
      }
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al procesar el pedido. Intente nuevamente.'),
  });

  useEffect(() => {
    if (isAuthenticated && customer) {
      const nameParts = customer.fullName ? customer.fullName.split(' ') : [];
      setInfo(prev => ({
        ...prev,
        firstName: nameParts[0] || prev.firstName,
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : prev.lastName,
        email: customer.email || prev.email,
        phone: customer.phone || prev.phone,
      }));
    }
  }, [isAuthenticated, customer]);

  useEffect(() => {
    if (settings?.shippingMethods?.length && !shippingMethod) {
      setShippingMethod(settings.shippingMethods[0].id);
    }
    if (settings?.paymentMethods?.length && !paymentMethod) {
      setPaymentMethod(settings.paymentMethods[0].id);
    }
  }, [settings, shippingMethod, paymentMethod]);

  useEffect(() => {
    if (isLoadingSettings || mutation.isPending || checkoutCompletedRef.current) return;
    if (items.length === 0) {
      navigate(`${prefix}/cart`, { replace: true });
    }
  }, [isLoadingSettings, items.length, mutation.isPending, navigate, prefix]);

  const handleCheckout = () => {
    if (!info.firstName || !info.email) {
      toast.error('Completá nombre y correo para continuar.');
      setStep(1);
      return;
    }
    mutation.mutate({
      customerInfo: {
        firstName: info.firstName,
        lastName: info.lastName,
        email: info.email,
        phone: info.phone,
        documentType: info.docType,
        documentNumber: info.docNum,
      },
      shippingInfo: {
        method: shippingMethod as 'SHIPPING' | 'PICKUP',
        address: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zip,
      },
      paymentMethod,
      cartLines: items.map(i => ({
        variantId: i.variantId,
        quantity: i.qty,
        price: i.price,
      })),
    });
  };

  if (isLoadingSettings) {
    return (
      <div className={styles.loadingWrap}>
        <Loader2 size={32} className="spin" color="var(--accent)" />
      </div>
    );
  }

  if (!isLoadingSettings && items.length === 0 && !mutation.isPending && !checkoutCompletedRef.current) {
    return null;
  }

  const steps = ['Datos', 'Envío', 'Pago'];

  return (
    <div className="storefront-checkout-container">
      <div className="storefront-checkout-left">
        <StorefrontStepper steps={steps} currentStep={step} />

        <div className={styles.panel}>
          {step === 1 && (
            <div className={clsx('animate-fade', styles.panelPad)}>
              <h2 className={styles.stepTitle}><User size={18} /> Datos del Comprador</h2>
              <div className={styles.formGrid}>
                <input className="storefront-input" placeholder="Nombre *" value={info.firstName} onChange={e => setInfo({...info, firstName: e.target.value})} />
                <input className="storefront-input" placeholder="Apellido" value={info.lastName} onChange={e => setInfo({...info, lastName: e.target.value})} />
                <input className={clsx('storefront-input', styles.span2)} placeholder="Correo Electrónico *" type="email" value={info.email} onChange={e => setInfo({...info, email: e.target.value})} />
                <input className="storefront-input" placeholder="Teléfono" value={info.phone} onChange={e => setInfo({...info, phone: e.target.value})} />
                <div className={styles.docRow}>
                  <select className={clsx('storefront-input', styles.docSelect)} value={info.docType} onChange={e => setInfo({...info, docType: e.target.value})}>
                    <option>DNI</option><option>CUIT</option>
                  </select>
                  <input className={clsx('storefront-input', styles.docInput)} placeholder="Número" value={info.docNum} onChange={e => setInfo({...info, docNum: e.target.value})} />
                </div>
              </div>
              <div className={styles.stepActions}>
                <button type="button" onClick={() => setStep(2)} className="storefront-btn">Continuar →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className={clsx('animate-fade', styles.panelPad)}>
              <h2 className={styles.stepTitle}><Truck size={18} /> Opciones de Entrega</h2>
              <div className={styles.optionRow}>
                {(settings?.shippingMethods || []).map(opt => {
                  const selected = shippingMethod === opt.id;
                  const Icon = opt.type === 'SHIPPING' ? Truck : Store;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setShippingMethod(opt.id)}
                      className={clsx(styles.optionCard, selected && styles.optionCardSelected)}
                    >
                      <Icon size={22} className={clsx(styles.optionIcon, selected && styles.optionIconSelected)} />
                      <h4 className={clsx(styles.optionName, selected && styles.optionNameSelected)}>{opt.name}</h4>
                      <p className={clsx(styles.optionPrice, selected && styles.optionPriceSelected)}>
                        {opt.price === 0 ? 'Gratis' : `+ ${formatCurrency(opt.price)}`}
                      </p>
                    </button>
                  );
                })}
              </div>
              {selectedShipping?.type === 'SHIPPING' && settings?.requireShippingData !== 'none' && (
                <div className={styles.formGrid}>
                  <input className={clsx('storefront-input', styles.span2)} placeholder="Calle y Número" value={shippingAddress.street} onChange={e => setShippingAddress({...shippingAddress, street: e.target.value})} />
                  <input className="storefront-input" placeholder="Ciudad" value={shippingAddress.city} onChange={e => setShippingAddress({...shippingAddress, city: e.target.value})} />
                  <div className={styles.addressRow}>
                    <input className={clsx('storefront-input', styles.addressState)} placeholder="Provincia" value={shippingAddress.state} onChange={e => setShippingAddress({...shippingAddress, state: e.target.value})} />
                    <input className={clsx('storefront-input', styles.addressZip)} placeholder="C.P." value={shippingAddress.zip} onChange={e => setShippingAddress({...shippingAddress, zip: e.target.value})} />
                  </div>
                </div>
              )}
              <div className={styles.stepActionsBetween}>
                <button type="button" onClick={() => setStep(1)} className="storefront-btn storefront-btn-secondary">← Volver</button>
                <button type="button" onClick={() => setStep(3)} className="storefront-btn">Continuar →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className={clsx('animate-fade', styles.panelPad)}>
              <h2 className={styles.stepTitle}><CreditCard size={18} /> Pago Seguro</h2>
              <div className={styles.paymentList}>
                {(settings?.paymentMethods || []).map(pm => (
                  <label
                    key={pm.id}
                    className={clsx(styles.paymentOption, paymentMethod === pm.id && styles.paymentOptionSelected)}
                  >
                    <input type="radio" checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} className={styles.paymentRadio} />
                    <div className={styles.paymentInfo}>
                      <p className={styles.paymentName}>{pm.name}</p>
                      <p className={styles.paymentType}>
                        {pm.type === 'CREDIT_CARD'
                          ? 'Mercado Pago'
                          : pm.type === 'BANK_TRANSFER'
                            ? 'Transferencia bancaria'
                            : pm.type === 'CASH'
                              ? 'Efectivo'
                              : pm.type}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {isBankTransfer && settings && hasBankTransferDetails(settings) && (
                <BankTransferDetails
                  className={styles.bankTransferPanel}
                  info={{ ...settings, transferCuit: (settings as any).transferCuit }}
                  amount={grandTotal}
                  formatAmount={formatCurrency}
                  buyerCuit={buyerCuit}
                  onBuyerCuitChange={setBuyerCuit}
                />
              )}
              {isBankTransfer && settings && !hasBankTransferDetails(settings) && (
                <p className={styles.secureHint}>
                  Elegiste transferencia. El comercio te compartirá los datos bancarios para completar el pago.
                </p>
              )}
              <div className={styles.stepActionsBetween}>
                <button type="button" onClick={() => setStep(2)} className="storefront-btn storefront-btn-secondary">← Volver</button>
                <button type="button" onClick={handleCheckout} disabled={mutation.isPending} className={clsx('storefront-btn', styles.confirmBtn)}>
                  {mutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Procesando...</> : '✓ Confirmar Pedido'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="storefront-checkout-right">
        <div className={clsx(styles.panel, styles.panelPadSm)}>
          <h3 className={styles.summaryTitle}>Tu pedido</h3>
          <div className={styles.lineList}>
            {items.map(i => (
              <div key={i.variantId} className={styles.lineItem}>
                <span className={styles.lineName}>{i.name} {i.size ? `(T.${i.size})` : ''} × {i.qty}</span>
                <span className={styles.linePrice}>{formatCurrency(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal</span><span className={styles.totalRowValue}>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Envío</span>
              <span className={SHIPPING_COST === 0 ? styles.totalRowFree : styles.totalRowValue}>
                {SHIPPING_COST === 0 ? 'GRATIS' : formatCurrency(SHIPPING_COST)}
              </span>
            </div>
            <div className={styles.grandTotalRow}>
              <span className={styles.grandTotalLabel}>Total</span>
              <span className={styles.grandTotalValue}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
