import { useEffect, useRef, useLayoutEffect, useState } from 'react';
import clsx from 'clsx';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Package, Loader2, Upload, CheckCheck } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';
import { formatSaleId } from '@/utils/formatId';
import { formatCurrency } from '@/utils/formatCurrency';
import { storefrontApi } from '@/api/storefront.api';
import { apiClient } from '@/api/client';
import toast from 'react-hot-toast';
import {
  BankTransferDetails,
  hasBankTransferDetails,
  StorefrontPage,
  StorefrontCard,
  type BankTransferInfo,
} from '@/components/storefront';
import sf from '@/components/storefront/storefront.module.css';

type CheckoutResultStatus = 'success' | 'failure' | 'pending';

interface Props {
  status: CheckoutResultStatus;
}

interface CheckoutResultLocationState {
  paymentMethod?: string;
  bankTransfer?: BankTransferInfo;
  grandTotal?: number;
}

const STATUS_CONFIG: Record<
  CheckoutResultStatus,
  {
    icon: typeof CheckCircle;
    iconColor: string;
    iconBg: string;
    title: string;
    description: (orderId?: string | null, isBankTransfer?: boolean) => string;
    primaryLabel: string;
    primaryTo: (prefix: string) => string;
    secondaryLabel?: string;
    secondaryTo?: (prefix: string) => string;
  }
> = {
  success: {
    icon: CheckCircle,
    iconColor: 'var(--green)',
    iconBg: 'var(--green-bg)',
    title: '¡Gracias por tu compra!',
    description: (orderId, isBankTransfer) => {
      if (isBankTransfer) {
        return orderId
          ? `Tu pedido ${formatSaleId(orderId)} quedó pendiente de pago. Transferí con los datos de abajo e incluí el número de pedido en el concepto.`
          : 'Tu pedido quedó pendiente de pago. Transferí con los datos de abajo e incluí el número de pedido en el concepto.';
      }
      return orderId
        ? `Tu pedido ${formatSaleId(orderId)} fue registrado correctamente. Te enviaremos novedades por correo o WhatsApp.`
        : 'Tu pedido fue registrado correctamente. Te enviaremos novedades por correo o WhatsApp.';
    },
    primaryLabel: 'Ver mis pedidos',
    primaryTo: (prefix) => `${prefix}/my-orders`,
    secondaryLabel: 'Seguir comprando',
    secondaryTo: (prefix) => `${prefix}/`,
  },
  failure: {
    icon: XCircle,
    iconColor: 'var(--red)',
    iconBg: 'var(--red-bg)',
    title: 'No se pudo completar el pago',
    description: (orderId) =>
      orderId
        ? `El pago del pedido ${formatSaleId(orderId)} no fue aprobado. Podés intentar nuevamente desde el carrito.`
        : 'El pago no fue aprobado. Podés intentar nuevamente desde el carrito.',
    primaryLabel: 'Volver al carrito',
    primaryTo: (prefix) => `${prefix}/cart`,
    secondaryLabel: 'Seguir comprando',
    secondaryTo: (prefix) => `${prefix}/`,
  },
  pending: {
    icon: Clock,
    iconColor: 'var(--amber, #f59e0b)',
    iconBg: 'rgba(245, 158, 11, 0.12)',
    title: 'Pago en proceso',
    description: (orderId) =>
      orderId
        ? `Tu pedido ${formatSaleId(orderId)} quedó pendiente de confirmación. Te avisaremos cuando se acredite el pago.`
        : 'Tu pago quedó pendiente de confirmación. Te avisaremos cuando se acredite.',
    primaryLabel: 'Ver mis pedidos',
    primaryTo: (prefix) => `${prefix}/my-orders`,
    secondaryLabel: 'Seguir comprando',
    secondaryTo: (prefix) => `${prefix}/`,
  },
};

function resolveMercadoPagoStatus(searchParams: URLSearchParams): CheckoutResultStatus | null {
  const raw =
    searchParams.get('collection_status') ||
    searchParams.get('status');

  if (!raw) return null;

  const normalized = raw.toLowerCase();
  if (normalized === 'approved' || normalized === 'success') return 'success';
  if (normalized === 'pending' || normalized === 'in_process' || normalized === 'in_mediation') return 'pending';
  if (normalized === 'rejected' || normalized === 'failure' || normalized === 'cancelled') return 'failure';
  return null;
}

export default function StorefrontCheckoutResultPage({ status }: Props) {
  const prefix = storePrefix();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);
  const locationState = (location.state || {}) as CheckoutResultLocationState;

  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('external_reference') ||
    searchParams.get('external_reference_id');

  const buyerCuit = searchParams.get('buyerCuit') || '';
  const paymentFromQuery = searchParams.get('payment') || '';
  const paymentMethod = locationState.paymentMethod || paymentFromQuery;
  const isBankTransfer = paymentMethod === 'BANK_TRANSFER';

  // Receipt upload state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  const handleReceiptUpload = async () => {
    if (!receiptFile || !orderId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('receipt', receiptFile);
      if (receiptNotes) form.append('notes', receiptNotes);
      if (buyerCuit) form.append('buyerTaxId', buyerCuit);
      await apiClient.patch(`/storefront/orders/${orderId}/payment-receipt`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadDone(true);
      toast.success('Comprobante enviado. Te avisaremos cuando confirmemos el pago.');
    } catch {
      toast.error('No se pudo enviar el comprobante. Intentá nuevamente.');
    } finally {
      setUploading(false);
    }
  };

  const mpStatus = resolveMercadoPagoStatus(searchParams);
  const effectiveStatus = mpStatus && mpStatus !== status ? mpStatus : status;

  const { data: settings } = useQuery({
    queryKey: ['storefrontSettings', prefix],
    queryFn: () => storefrontApi.getSettings(),
    enabled: isBankTransfer && (effectiveStatus === 'success' || effectiveStatus === 'pending'),
  });

  const bankTransferInfo: BankTransferInfo | undefined =
    locationState.bankTransfer ||
    (settings
      ? {
          transferCbu: settings.transferCbu,
          transferAlias: settings.transferAlias,
          transferHolderName: settings.transferHolderName,
          transferBankName: settings.transferBankName,
        }
      : undefined);

  const config = STATUS_CONFIG[effectiveStatus];
  const Icon = config.icon;
  const iconWrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (iconWrapRef.current) iconWrapRef.current.style.background = config.iconBg;
  }, [config.iconBg]);

  useEffect(() => {
    if (mpStatus && mpStatus !== status) {
      const query = searchParams.toString();
      const target = `${prefix}/checkout/${mpStatus}${query ? `?${query}` : ''}`;
      navigate(target, { replace: true });
    }
  }, [mpStatus, status, navigate, prefix, searchParams]);

  useEffect(() => {
    if (effectiveStatus === 'success' || effectiveStatus === 'pending') {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
    }
  }, [effectiveStatus, clearCart, queryClient]);

  const showBankDetails =
    isBankTransfer &&
    (effectiveStatus === 'success' || effectiveStatus === 'pending') &&
    hasBankTransferDetails(bankTransferInfo);

  return (
    <StorefrontPage variant="medium" className={sf.resultPage}>
      <StorefrontCard className={sf.resultCard} padded={false}>
        <div ref={iconWrapRef} className={sf.resultIconWrap}>
          <Icon size={48} color={config.iconColor} />
        </div>

        <h1 className={sf.resultTitle}>
          {isBankTransfer && effectiveStatus === 'success' ? 'Pedido registrado' : config.title}
        </h1>

        <p className={sf.resultText}>{config.description(orderId, isBankTransfer)}</p>

        {showBankDetails && bankTransferInfo && (
          <BankTransferDetails
            info={bankTransferInfo}
            amount={locationState.grandTotal}
            formatAmount={formatCurrency}
          />
        )}

        {effectiveStatus === 'pending' && (
          <div className={sf.resultPending}>
            <Loader2 size={16} className="spin" />
            Estamos verificando el estado del pago...
          </div>
        )}

        {/* Receipt Upload Section — only for bank transfer success orders */}
        {isBankTransfer && effectiveStatus === 'success' && orderId && !uploadDone && (
          <div style={{ margin: '20px 0', textAlign: 'left', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', background: 'var(--surface-1)' }}>
            <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={16} color="var(--sf-primary, var(--accent))" />
              Adjuntá tu comprobante de transferencia
            </p>
            <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Subí la captura o PDF de la transferencia para agilizar la confirmación de tu pedido.
            </p>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={e => setReceiptFile(e.target.files?.[0] ?? null)}
              style={{ display: 'block', width: '100%', marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}
              id="receipt-upload-input"
            />
            <input
              className="storefront-input"
              placeholder="Nota opcional (p.ej. número de referencia bancaria)"
              value={receiptNotes}
              onChange={e => setReceiptNotes(e.target.value)}
              style={{ marginBottom: '12px' }}
            />
            <button
              type="button"
              className="storefront-btn"
              onClick={handleReceiptUpload}
              disabled={!receiptFile || uploading}
              style={{ width: '100%', opacity: (!receiptFile || uploading) ? 0.6 : 1 }}
            >
              {uploading ? <><Loader2 size={15} className="animate-spin" /> Enviando...</> : <><Upload size={15} /> Enviar Comprobante</>}
            </button>
          </div>
        )}

        {isBankTransfer && effectiveStatus === 'success' && uploadDone && (
          <div style={{ margin: '20px 0', padding: '16px', borderRadius: '12px', background: 'var(--green-bg)', border: '1px solid rgba(27,127,58,0.25)', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 600 }}>
            <CheckCheck size={18} />
            Comprobante recibido. Te avisaremos cuando confirmemos el pago.
          </div>
        )}

        <div className={sf.resultActions}>
          <Link to={config.primaryTo(prefix)} className={clsx('storefront-btn', sf.resultPrimaryLink)}>
            <Package size={18} />
            {config.primaryLabel}
          </Link>

          {config.secondaryLabel && config.secondaryTo && (
            <Link to={config.secondaryTo(prefix)} className={sf.resultLink}>
              {config.secondaryLabel}
            </Link>
          )}
        </div>

      </StorefrontCard>
    </StorefrontPage>
  );
}
