import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link, useOutletContext } from 'react-router-dom';
import { User, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { storefrontAuthApi } from '@/api/storefront-auth.api';
import { useStorefrontAuthStore } from '@/store/storefrontAuth.store';
import { storePrefix } from '@/utils/storefrontDomain';
import { getStoreLoginChannelConfig } from '@/utils/storeLoginChannel';
import type { StorefrontSettings } from '@/api/storefront.api';
import { StorefrontRequireAuth } from '@/components/storefront/StorefrontRequireAuth';

function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('549')) return digits.slice(3);
  if (digits.startsWith('54')) return digits.slice(2);
  return digits;
}

function normalizePhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('54') && digits.length > 11) return digits;
  if (digits.startsWith('0')) return '54' + digits.slice(1);
  return '549' + digits;
}

function ProfileForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = storePrefix();
  const { customer, setCustomer } = useStorefrontAuthStore();
  const { settings } = useOutletContext<{ settings?: StorefrontSettings }>();

  const loginConfig = getStoreLoginChannelConfig(settings?.storeLoginChannels);
  const isOnboarding = customer?.profileComplete === false;
  const from = (location.state as { from?: string } | null)?.from || `${prefix}/`;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loginViaEmail = loginConfig.channel === 'EMAIL';

  useEffect(() => {
    if (!customer) return;
    setFullName(
      customer.fullName?.startsWith('Cliente +') || customer.fullName === customer.email?.split('@')[0]
        ? ''
        : customer.fullName || '',
    );
    setEmail(customer.email || '');
    setPhone(formatPhoneDisplay(customer.phone));
    setTaxId(customer.taxId || '');
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Ingresá tu nombre y apellido.');
      return;
    }
    if (!taxId.trim()) {
      setError('Ingresá tu DNI o CUIT.');
      return;
    }
    if (!email.trim()) {
      setError('Ingresá tu correo electrónico.');
      return;
    }
    if (!phone.trim()) {
      setError('Ingresá tu número de teléfono.');
      return;
    }

    setLoading(true);
    try {
      const updated = await storefrontAuthApi.updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: normalizePhoneInput(phone),
        taxId: taxId.trim(),
      });
      setCustomer(updated);
      toast.success(isOnboarding ? '¡Perfil completado!' : 'Datos actualizados correctamente.');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'No se pudieron guardar los datos. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '48px auto', padding: '0 24px' }}>
      <div
        className="glass animate-fade"
        style={{
          padding: '40px 32px',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'var(--sf-primary, var(--accent))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <User size={30} />
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isOnboarding ? 'Completá tu registro' : 'Mis datos'}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
            {isOnboarding
              ? 'Necesitamos algunos datos para procesar tus pedidos y facturación.'
              : 'Actualizá tu información personal cuando lo necesites.'}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--red-bg)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px',
              color: 'var(--red)',
              padding: '12px 14px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Nombre y apellido *
          </label>
          <input
            className="storefront-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: Juan Pérez"
            autoComplete="name"
            style={{ width: '100%', marginBottom: '16px' }}
          />

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
            DNI / CUIT *
          </label>
          <input
            className="storefront-input"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="Ej: 30123456"
            inputMode="numeric"
            style={{ width: '100%', marginBottom: '16px' }}
          />

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Correo electrónico *
          </label>
          <input
            className="storefront-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            readOnly={loginViaEmail && !!customer?.email}
            autoComplete="email"
            style={{
              width: '100%',
              marginBottom: '16px',
              opacity: loginViaEmail && !!customer?.email ? 0.7 : 1,
            }}
          />
          {loginViaEmail && !!customer?.email && (
            <p style={{ margin: '-12px 0 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Este es el correo con el que iniciaste sesión.
            </p>
          )}

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Teléfono *
          </label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: loginViaEmail ? '20px' : '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--sf-primary-subtle, var(--accent-subtle))',
                border: '1px solid rgba(var(--sf-primary-rgb, 59, 130, 246), 0.2)',
                borderRadius: '10px',
                padding: '0 12px',
                color: 'var(--sf-primary, var(--accent))',
                fontWeight: 700,
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              🇦🇷 +54
            </div>
            <input
              className="storefront-input"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11 2345 6789"
              readOnly={!loginViaEmail && !!customer?.phone}
              autoComplete="tel"
              style={{ flex: 1, opacity: !loginViaEmail && !!customer?.phone ? 0.7 : 1 }}
            />
          </div>
          {!loginViaEmail && !!customer?.phone && (
            <p style={{ margin: '0 0 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Este es el teléfono con el que iniciaste sesión.
            </p>
          )}

          <button
            type="submit"
            className="storefront-btn w-full"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" /> Guardando...
              </>
            ) : (
              <>
                <Save size={18} /> {isOnboarding ? 'Completar registro' : 'Guardar cambios'}
              </>
            )}
          </button>
        </form>

        {!isOnboarding && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link
              to={`${prefix}/my-orders`}
              style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}
            >
              ← Volver a mis pedidos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StorefrontProfilePage() {
  return (
    <StorefrontRequireAuth>
      <ProfileForm />
    </StorefrontRequireAuth>
  );
}
