import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useNavigate, useLocation, Link, useOutletContext } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { storefrontAuthApi } from '@/api/storefront-auth.api';
import { useStorefrontAuthStore } from '@/store/storefrontAuth.store';
import { storePrefix } from '@/utils/storefrontDomain';
import { getStoreLoginChannelConfig } from '@/utils/storeLoginChannel';
import type { StorefrontSettings } from '@/api/storefront.api';

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
    <div style={{ maxWidth: '480px', margin: '64px auto', padding: '0 24px' }}>
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
              boxShadow: '0 8px 24px rgba(var(--sf-primary-rgb, 59, 130, 246), 0.25)',
            }}
          >
            <LoginIcon size={30} />
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>
            Accedé a tu cuenta
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
            {loginConfig.subtitle} en {storeName}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          <div
            style={{
              width: step === 'identifier' ? 28 : 8,
              height: 8,
              borderRadius: 4,
              background: step === 'identifier' ? 'var(--sf-primary, var(--accent))' : 'var(--border-strong)',
              transition: 'all 0.3s ease',
            }}
          />
          <div
            style={{
              width: step === 'otp' ? 28 : 8,
              height: 8,
              borderRadius: 4,
              background: step === 'otp' ? 'var(--sf-primary, var(--accent))' : 'var(--border-strong)',
              transition: 'all 0.3s ease',
            }}
          />
        </div>

        {error && (
          <div
            className="animate-fade"
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
        {info && !error && (
          <div
            className="animate-fade"
            style={{
              background: 'var(--green-bg)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '10px',
              color: 'var(--green)',
              padding: '12px 14px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {info}
          </div>
        )}

        {step === 'identifier' && (
          <div className="animate-fade">
            <label
              style={{
                display: 'block',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '8px',
              }}
            >
              {loginConfig.inputLabel}
            </label>
            {loginConfig.channel === 'EMAIL' ? (
              <input
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
                style={{ width: '100%', marginBottom: '8px' }}
              />
            ) : (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
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
                  style={{ flex: 1 }}
                />
              </div>
            )}
            <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.5 }}>
              {loginConfig.hint}
            </p>

            <button
              className="storefront-btn w-full"
              onClick={handleSendOtp}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '16px',
                padding: 0,
              }}
            >
              <ArrowLeft size={14} /> {loginConfig.changeLabel}
            </button>

            <label
              style={{
                display: 'block',
                textAlign: 'center',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Ingresá el código de 6 dígitos
            </label>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', margin: '0 0 16px' }}>
              Enviado a {loginConfig.sentToLabel(identifier)}
            </p>

            <div
              style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}
              onPaste={handleOtpPaste}
            >
              {otp.map((digit, i) => {
                const focused = focusedOtp === i;
                const filled = digit !== '';
                return (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onFocus={() => setFocusedOtp(i)}
                    onBlur={() => setFocusedOtp(-1)}
                    aria-label={`Dígito ${i + 1}`}
                    style={{
                      width: '48px',
                      height: '56px',
                      borderRadius: '10px',
                      border: `2px solid ${
                        focused
                          ? 'var(--sf-primary, var(--accent))'
                          : filled
                            ? 'rgba(var(--sf-primary-rgb, 59, 130, 246), 0.35)'
                            : 'var(--border)'
                      }`,
                      background: focused
                        ? 'var(--sf-primary-subtle, var(--accent-subtle))'
                        : 'var(--bg-overlay, #f8fafc)',
                      color: 'var(--text-primary)',
                      fontSize: '22px',
                      fontWeight: 800,
                      textAlign: 'center',
                      outline: 'none',
                      transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                      boxShadow: focused ? '0 0 0 3px rgba(var(--sf-primary-rgb, 59, 130, 246), 0.12)' : 'none',
                      caretColor: 'var(--sf-primary, var(--accent))',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  />
                );
              })}
            </div>

            <button
              className="storefront-btn w-full"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.some((d) => d === '')}
              style={{
                opacity: loading || otp.some((d) => d === '') ? 0.6 : 1,
                cursor: loading || otp.some((d) => d === '') ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" /> Verificando...
                </>
              ) : (
                'Confirmar código'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
              {countdown > 0 ? (
                <>
                  ¿No llegó? Podés reenviar en{' '}
                  <strong style={{ color: 'var(--sf-primary, var(--accent))' }}>{countdown}s</strong>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--sf-primary, var(--accent))',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  {loginConfig.resendLabel}
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link
            to={`${prefix}/`}
            style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}
          >
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
