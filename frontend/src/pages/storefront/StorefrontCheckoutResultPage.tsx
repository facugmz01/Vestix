import { useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Package, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';
import { formatSaleId } from '@/utils/formatId';
import { StorefrontPage, StorefrontCard } from '@/components/storefront';
import sf from '@/components/storefront/storefront.module.css';

type CheckoutResultStatus = 'success' | 'failure' | 'pending';

interface Props {
  status: CheckoutResultStatus;
}

const STATUS_CONFIG: Record<
  CheckoutResultStatus,
  {
    icon: typeof CheckCircle;
    iconColor: string;
    iconBg: string;
    title: string;
    description: (orderId?: string | null) => string;
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
    description: (orderId) =>
      orderId
        ? `Tu pedido ${formatSaleId(orderId)} fue registrado correctamente. Te enviaremos novedades por correo o WhatsApp.`
        : 'Tu pedido fue registrado correctamente. Te enviaremos novedades por correo o WhatsApp.',
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
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);

  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('external_reference') ||
    searchParams.get('external_reference_id');

  const mpStatus = resolveMercadoPagoStatus(searchParams);
  const effectiveStatus = mpStatus && mpStatus !== status ? mpStatus : status;

  const config = STATUS_CONFIG[effectiveStatus];
  const Icon = config.icon;

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

  return (
    <StorefrontPage variant="medium" className={sf.resultPage}>
      <StorefrontCard className={sf.resultCard} padded={false}>
        <div className={sf.resultIconWrap} style={{ background: config.iconBg }}>
          <Icon size={48} color={config.iconColor} />
        </div>

        <h1 className={sf.resultTitle}>{config.title}</h1>

        <p className={sf.resultText}>{config.description(orderId)}</p>

        {effectiveStatus === 'pending' && (
          <div className={sf.resultPending}>
            <Loader2 size={16} className="spin" />
            Estamos verificando el estado del pago...
          </div>
        )}

        <div className={sf.resultActions}>
          <Link to={config.primaryTo(prefix)} className="storefront-btn" style={{ textDecoration: 'none' }}>
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
