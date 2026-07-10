import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import clsx from 'clsx';
import { useNavigate, useLocation, Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { storefrontAuthApi } from '@/api/storefront-auth.api';
import { useStorefrontAuthStore } from '@/store/storefrontAuth.store';
import { storePrefix } from '@/utils/storefrontDomain';
import { getStoreLoginChannelConfig } from '@/utils/storeLoginChannel';
import type { StorefrontSettings } from '@/api/storefront.api';
import {
  StorefrontPage,
  StorefrontCard,
  StorefrontAlert,
  StorefrontStepper,
} from '@/components/storefront';
import sf from '@/components/storefront/storefront.module.css';

export default function StorefrontLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = storePrefix();
  const setCustomer = useStorefrontAuthStore((s) => s.setCustomer);
  const { settings } = useOutletContext<{ settings?: StorefrontSettings }>();

  const loginConfig = getStoreLoginChannelConfig(settings?.storeLoginChannels);
  const LoginIcon = loginConfig.icon;

  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [focusedOtp, setFocusedOtp] = useState(-1);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const storeName = settings?.storeName || 'ERPStore';

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const startCountdown = useCallback((seconds = 60) => {
    setCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((s) => {
        if (s <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const buildAuthPayload = () => loginConfig.buildPayload(identifier);

  const handleSendOtp = async () => {
    const validationError = loginConfig.validate(identifier);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');

    try {
      const res = await storefrontAuthApi.sendOtp(buildAuthPayload());
      setStep('otp');
      setInfo(res.message || 'Código enviado.');
      startCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 200);
    } catch (e: any) {
      setError(e?.message || 'No se pudo enviar el código. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await storefrontAuthApi.sendOtp(buildAuthPayload());
      setInfo(res.message || 'Nuevo código enviado.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      startCountdown(60);
    } catch (e: any) {
      setError(e?.message || 'No se pudo reenviar el código.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (digits?: string[]) => {
    const code = (digits || otp).join('');
    if (code.length < 6) {
      setError('Ingresá los 6 dígitos del código.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await storefrontAuthApi.verifyOtp({
        ...buildAuthPayload(),
        code,
      });
      setCustomer(result.customer);

      const from = (location.state as { from?: string } | null)?.from || `${prefix}/`;
      if (result.customer.profileComplete === false) {
        navigate(`${prefix}/profile`, { replace: true, state: { from } });
      } else {
        navigate(from, { replace: true });
      }
    } catch (e: any) {
      setError(e?.message || 'Código incorrecto. Verificá e intentá de nuevo.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = char;
    setOtp(next);

    if (char && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (char && index === 5 && next.every((d) => d !== '')) {
      handleVerifyOtp(next);
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
      setOtp(next);
      const lastIdx = Math.min(pasted.length, 5);
      otpRefs.current[lastIdx]?.focus();
      if (pasted.length === 6) {
        handleVerifyOtp(next);
      }
    }
  };

  return (
    <StorefrontPage variant="narrow">
      <StorefrontCard>
        <div className={sf.cardHeader}>
          <div className={sf.cardIcon}>
            <LoginIcon size={30} />
          </div>
          <h1 className={sf.cardTitle}>Accedé a tu cuenta</h1>
          <p className={sf.cardSubtitle}>
            {loginConfig.subtitle} en {storeName}
          </p>
        </div>

        <StorefrontStepper
          steps={['Identificación', 'Código']}
          currentStep={step === 'identifier' ? 1 : 2}
          variant="dots"
        />

        {error && <StorefrontAlert variant="error">{error}</StorefrontAlert>}
        {info && !error && <StorefrontAlert variant="success">{info}</StorefrontAlert>}

        {step === 'identifier' && (
          <div className="animate-fade">
            <label className={sf.label} htmlFor="sf-login-id">
              {loginConfig.inputLabel}
            </label>
            {loginConfig.channel === 'EMAIL' ? (
              <input
                id="sf-login-id"
                className="storefront-input"
                type={loginConfig.inputType}
                inputMode={loginConfig.inputMode}
                placeholder={loginConfig.placeholder}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                autoFocus
                autoComplete="email"
              />
            ) : (
              <div className={sf.phoneRow}>
                <div className={sf.phonePrefix}>🇦🇷 +54</div>
                <input
                  id="sf-login-id"
                  className="storefront-input"
                  type={loginConfig.inputType}
                  inputMode={loginConfig.inputMode}
                  placeholder={loginConfig.placeholder}
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  autoFocus
                  autoComplete="tel"
                />
              </div>
            )}
            <p className={sf.hint}>{loginConfig.hint}</p>

            <button
              type="button"
              className={`storefront-btn ${sf.wFull}`}
              onClick={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" /> Enviando...
                </>
              ) : (
                <>
                  <LoginIcon size={18} /> {loginConfig.buttonLabel}
                </>
              )}
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="animate-fade">
            <button
              type="button"
              onClick={() => {
                setStep('identifier');
                setError('');
                setOtp(['', '', '', '', '', '']);
              }}
              className={sf.backBtn}
            >
              <ArrowLeft size={14} /> {loginConfig.changeLabel}
            </button>

            <label className={clsx(sf.label, sf.textCenter)}>
              Ingresá el código de 6 dígitos
            </label>
            <p className={clsx(sf.hint, sf.hintCenter)}>
              Enviado a {loginConfig.sentToLabel(identifier)}
            </p>

            <div className={sf.otpRow} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => {
                const focused = focusedOtp === i;
                const filled = digit !== '';
                return (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onFocus={() => setFocusedOtp(i)}
                    onBlur={() => setFocusedOtp(-1)}
                    aria-label={`Dígito ${i + 1}`}
                    className={`${sf.otpDigit} ${filled ? sf.otpDigitFilled : ''} ${focused ? sf.otpDigitFocused : ''}`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              className={`storefront-btn ${sf.wFull}`}
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.some((d) => d === '')}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" /> Verificando...
                </>
              ) : (
                'Confirmar código'
              )}
            </button>

            <div className={sf.resendRow}>
              {countdown > 0 ? (
                <>
                  ¿No llegó? Podés reenviar en{' '}
                  <strong className={sf.countdownAccent}>{countdown}s</strong>
                </>
              ) : (
                <button type="button" onClick={handleResendOtp} disabled={loading} className={sf.resendBtn}>
                  {loginConfig.resendLabel}
                </button>
              )}
            </div>
          </div>
        )}

        <div className={sf.footerLink}>
          <Link to={`${prefix}/`}>← Volver a la tienda</Link>
        </div>
      </StorefrontCard>
    </StorefrontPage>
  );
}
