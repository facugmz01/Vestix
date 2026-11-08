import { useState } from 'react';
import { ArrowLeft, Banknote, CreditCard, QrCode, ArrowLeftRight, Wallet, Layers } from 'lucide-react';
import { Modal, Input } from '@/components/ui';
import { formatCurrency } from '@/utils/formatCurrency';
import { POS_PAYMENT_METHODS, type PosPaymentMethodId } from '../constants/posPaymentMethods';
import styles from './CheckoutDialog.module.css';

type CartLine = { variant: { id: string; name?: string; productName?: string; product?: { name?: string } }; qty: number; customUnitPrice?: number; discountPct?: number; discountValue?: number; discountType?: string };
const icons = { CASH: Banknote, CREDIT_CARD: CreditCard, QR_MERCADOPAGO: QrCode, BANK_TRANSFER: ArrowLeftRight, CUSTOMER_CREDIT: Wallet, STORE_CREDIT: Wallet, MULTIPLE: Layers };

export function CheckoutDialog({ open, onClose, onSelectMethod, amountDue, grandTotal, cart, totalItems, customerName, initialMethod }: {
  open: boolean; onClose: () => void; onSelectMethod: (method: PosPaymentMethodId, reference?: string) => void; amountDue: number; grandTotal: number; cart: CartLine[]; totalItems: number; customerName: string; initialMethod?: PosPaymentMethodId;
}) {
  const [method, setMethod] = useState<PosPaymentMethodId>(initialMethod || 'CASH');
  const [tendered, setTendered] = useState(amountDue);
  const [reference, setReference] = useState('');
  const selected = POS_PAYMENT_METHODS.find(x => x.id === method)!;
  return <Modal open={open} onClose={onClose} title="Checkout">
    <div className={styles.checkout}>
      <div className={styles.headline}><div><span>Total a cobrar</span><strong>{formatCurrency(amountDue)}</strong></div><span>{totalItems} unidades · {cart.length} artículos</span></div>
      <div className={styles.context}><strong>{customerName}</strong><div>{cart.slice(0, 4).map((line, i) => <span key={`${line.variant.id}-${i}`}>{line.qty} × {line.variant.name || line.variant.productName || line.variant.product?.name || 'Producto'}</span>)}{cart.length > 4 && <span>y {cart.length - 4} artículos más</span>}</div>{amountDue < grandTotal && <small>Total de venta {formatCurrency(grandTotal)}</small>}</div>
      <h3>Medio de pago</h3>
      <div className={styles.methods} role="radiogroup" aria-label="Medio de pago">{POS_PAYMENT_METHODS.map(item => { const Icon = icons[item.id]; return <button key={item.id} type="button" role="radio" aria-checked={method === item.id} className={method === item.id ? styles.active : ''} onClick={() => setMethod(item.id)}><Icon size={18}/><span>{item.label}</span></button>; })}</div>
      {method === 'CASH' && <div className={styles.details}><label>Importe recibido</label><Input type="number" min={amountDue} value={tendered} onChange={e => setTendered(Number(e.target.value))}/><strong>{tendered >= amountDue ? `Vuelto: ${formatCurrency(tendered - amountDue)}` : 'El importe debe cubrir el total'}</strong></div>}
      {(method === 'BANK_TRANSFER' || method === 'CREDIT_CARD') && <div className={styles.details}><label>{method === 'BANK_TRANSFER' ? 'Referencia de transferencia' : 'Cupón / lote (opcional)'}</label><Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Referencia de operación"/></div>}
      {method === 'QR_MERCADOPAGO' && <p className={styles.hint}>Al continuar se generará una orden QR para este total.</p>}
      {method === 'MULTIPLE' && <p className={styles.hint}>En el siguiente paso distribuís el total entre varios medios de pago.</p>}
      {(method === 'STORE_CREDIT' || method === 'CUSTOMER_CREDIT') && <p className={styles.hint}>Se aplicará a {customerName}. La disponibilidad se valida antes de continuar.</p>}
      <footer><button type="button" className={styles.back} onClick={onClose}><ArrowLeft size={16}/> Volver al pedido</button><button type="button" className={styles.continue} disabled={method === 'CASH' && tendered < amountDue} onClick={() => onSelectMethod(method, reference)}>Continuar con {selected.shortLabel}</button></footer>
    </div>
  </Modal>;
}
