import { useEffect, useRef, useLayoutEffect } from 'react';
import clsx from 'clsx';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Package, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';
import { formatSaleId } from '@/utils/formatId';
import { formatCurrency } from '@/utils/formatCurrency';
import { storefrontApi } from '@/api/storefront.api';
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

  const paymentFromQuery = searchParams.get('payment') || '';
  const paymentMethod = locationState.paymentMethod || paymentFromQuery;
  const isBankTransfer = paymentMethod === 'BANK_TRANSFER';

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
