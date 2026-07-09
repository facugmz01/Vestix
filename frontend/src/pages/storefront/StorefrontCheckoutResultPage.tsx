import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Package, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';
import { formatSaleId } from '@/utils/formatId';

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
    iconColor: '#f59e0b',
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

export default function StorefrontCheckoutResultPage({ status }: Props) {
  const prefix = storePrefix();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);

  const orderId =
    searchParams.get('orderId') ||
    searchParams.get('external_reference') ||
    searchParams.get('external_reference_id');

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  useEffect(() => {
    if (status === 'success' || status === 'pending') {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['storefront'] });
    }
  }, [status, clearCart, queryClient]);

  return (
    <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 24px' }}>
      <div
        className="glass animate-fade"
        style={{
          padding: '48px 32px',
          textAlign: 'center',
          borderRadius: '20px',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            background: config.iconBg,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Icon size={48} color={config.iconColor} />
        </div>

        <h1
          style={{
            margin: '0 0 12px',
            fontSize: '26px',
            fontWeight: 900,
            color: 'var(--text-primary)',
          }}
        >
          {config.title}
        </h1>

        <p
          style={{
            margin: '0 0 28px',
            color: 'var(--text-secondary)',
            fontSize: '15px',
            lineHeight: 1.6,
          }}
        >
          {config.description(orderId)}
        </p>

        {status === 'pending' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '24px',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            <Loader2 size={16} className="spin" />
            Estamos verificando el estado del pago...
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link to={config.primaryTo(prefix)} className="storefront-btn" style={{ textDecoration: 'none' }}>
            <Package size={18} />
            {config.primaryLabel}
          </Link>

          {config.secondaryLabel && config.secondaryTo && (
            <Link
              to={config.secondaryTo(prefix)}
              style={{
                color: 'var(--text-muted)',
                fontSize: '14px',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              {config.secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
