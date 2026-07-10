import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { User, Loader2, Save } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { storefrontAuthApi } from '@/api/storefront-auth.api';
import { useStorefrontAuthStore } from '@/store/storefrontAuth.store';
import { storePrefix } from '@/utils/storefrontDomain';
import { getStoreLoginChannelConfig } from '@/utils/storeLoginChannel';
import type { StorefrontSettings } from '@/api/storefront.api';
import { StorefrontRequireAuth } from '@/components/storefront/StorefrontRequireAuth';
import { StorefrontPage, StorefrontCard, StorefrontAlert } from '@/components/storefront';
import sf from '@/components/storefront/storefront.module.css';

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
    <StorefrontPage variant="narrow">
      <StorefrontCard>
        <div className={sf.cardHeader}>
          <div className={sf.cardIcon}>
            <User size={30} />
          </div>
          <h1 className={sf.cardTitle}>
            {isOnboarding ? 'Completá tu registro' : 'Mis datos'}
          </h1>
          <p className={sf.cardSubtitle}>
            {isOnboarding
              ? 'Necesitamos algunos datos para procesar tus pedidos y facturación.'
              : 'Actualizá tu información personal cuando lo necesites.'}
          </p>
        </div>

        {error && <StorefrontAlert variant="error">{error}</StorefrontAlert>}

        <form onSubmit={handleSubmit}>
          <label className={sf.label}>Nombre y apellido *</label>
          <input
            className={clsx('storefront-input', sf.inputMb)}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: Juan Pérez"
            autoComplete="name"
          />

          <label className={sf.label}>DNI / CUIT *</label>
          <input
            className={clsx('storefront-input', sf.inputMb)}
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="Ej: 30123456"
            inputMode="numeric"
          />

          <label className={sf.label}>Correo electrónico *</label>
          <input
            className={clsx('storefront-input', sf.inputMb, loginViaEmail && !!customer?.email && sf.inputReadonly)}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            readOnly={loginViaEmail && !!customer?.email}
            autoComplete="email"
          />
          {loginViaEmail && !!customer?.email && (
            <p className={clsx(sf.hint, sf.hintTight)}>Este es el correo con el que iniciaste sesión.</p>
          )}

          <label className={sf.label}>Teléfono *</label>
          <div className={sf.phoneRow}>
            <div className={sf.phonePrefix}>🇦🇷 +54</div>
            <input
              className={clsx('storefront-input', !loginViaEmail && !!customer?.phone && sf.inputReadonly, sf.flex1)}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11 2345 6789"
              readOnly={!loginViaEmail && !!customer?.phone}
              autoComplete="tel"
            />
          </div>
          {!loginViaEmail && !!customer?.phone && (
            <p className={sf.hint}>Este es el teléfono con el que iniciaste sesión.</p>
          )}

          <button
            type="submit"
            className={clsx('storefront-btn', sf.wFull, loading ? sf.btnLoading : sf.btnReady)}
            disabled={loading}
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
          <div className={sf.footerLink}>
            <Link to={`${prefix}/my-orders`}>← Volver a mis pedidos</Link>
          </div>
        )}
      </StorefrontCard>
    </StorefrontPage>
  );
}

export default function StorefrontProfilePage() {
  return (
    <StorefrontRequireAuth>
      <ProfileForm />
    </StorefrontRequireAuth>
  );
}
