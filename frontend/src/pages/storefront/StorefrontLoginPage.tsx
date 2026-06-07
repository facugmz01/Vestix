import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { storefrontAuthApi } from '@/api/storefront-auth.api';
import { useStorefrontAuthStore } from '@/store/storefrontAuth.store';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1a14 50%, #0a0f1a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrb1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
    top: '-100px',
    right: '-100px',
    pointerEvents: 'none',
  },
  glowOrb2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
    bottom: '-150px',
    left: '-100px',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '24px',
    padding: '2.5rem 2rem',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  logoArea: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  waIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
    boxShadow: '0 4px 24px rgba(16,185,129,0.4)',
    fontSize: '28px',
  },
  title: {
    color: '#f0fdf4',
    fontSize: '1.5rem',
    fontWeight: 700,
    margin: '0 0 0.25rem',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.875rem',
    margin: 0,
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.75rem',
    justifyContent: 'center',
  } as React.CSSProperties,
  label: {
    display: 'block',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.8125rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
    letterSpacing: '0.01em',
  },
  phoneWrapper: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.25rem',
  },
  prefix: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(16,185,129,0.08)',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: '12px',
    padding: '0 0.875rem',
    color: '#10b981',
    fontWeight: 600,
    fontSize: '1rem',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '0.875rem 1rem',
    color: '#ffffff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    width: '100%',
  },
  hint: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: '0.75rem',
    marginTop: '0.4rem',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
  btn: {
    width: '100%',
    padding: '0.9rem',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s, opacity 0.15s',
    boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
    letterSpacing: '0.01em',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
  },
  error: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: '10px',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    marginBottom: '1rem',
    animation: 'shake 0.4s ease',
  },
  success: {
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
    borderRadius: '10px',
    color: '#6ee7b7',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    marginBottom: '1rem',
  },
  otpGrid: {
    display: 'flex',
    gap: '0.625rem',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.45)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    marginBottom: '1.25rem',
    padding: '0.25rem 0',
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    transition: 'color 0.2s',
  },
  timer: {
    textAlign: 'center' as const,
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.8rem',
    marginTop: '1rem',
  },
  timerLink: {
    color: '#10b981',
    cursor: 'pointer',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    fontSize: '0.8rem',
    padding: 0,
  },
  storeLink: {
    textAlign: 'center' as const,
    marginTop: '1.5rem',
    color: 'rgba(255,255,255,0.35)',
    fontSize: '0.8125rem',
  },
};

// ─── Dynamic style functions (can't be in Record<string, CSSProperties>) ─────
const stepDotStyle = (active: boolean): React.CSSProperties => ({
  width: active ? '28px' : '8px',
  height: '8px',
  borderRadius: '4px',
  background: active ? '#10b981' : 'rgba(255,255,255,0.15)',
  transition: 'all 0.3s ease',
});

const otpBoxStyle = (focused: boolean, filled: boolean): React.CSSProperties => ({
  width: '52px',
  height: '64px',
  borderRadius: '12px',
  border: `2px solid ${focused ? '#10b981' : filled ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
  background: focused ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
  color: '#ffffff',
  fontSize: '1.75rem',
  fontWeight: 700,
  textAlign: 'center',
  outline: 'none',
  transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
  boxShadow: focused ? '0 0 0 4px rgba(16,185,129,0.12)' : 'none',
  caretColor: '#10b981',
  fontFamily: "'Inter', monospace",
});

// ─── Global CSS for animations ───────────────────────────────────────────────
const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }

  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .sf-step-enter { animation: fadeSlideUp 0.35s ease forwards; }

  .sf-btn:not(:disabled):hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 8px 30px rgba(16,185,129,0.5) !important;
  }
  .sf-btn:not(:disabled):active {
    transform: translateY(0) !important;
  }

  .sf-input:focus {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important;
    background: rgba(16,185,129,0.06) !important;
  }

  .sf-backbtn:hover { color: rgba(255,255,255,0.7) !important; }
`;

// ─── Utils ────────────────────────────────────────────────────────────────────

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return digits;
  // Strip any leading 54 that the user may have added (we prepend it)
  if (digits.startsWith('54') && digits.length > 11) return digits;
  if (digits.startsWith('0')) return '54' + digits.slice(1);
  return '549' + digits;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StorefrontLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setCustomer = useStorefrontAuthStore((s) => s.setCustomer);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [focusedOtp, setFocusedOtp] = useState(-1);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Inject global CSS once
  useEffect(() => {
    const id = 'sf-login-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = globalCSS;
      document.head.appendChild(style);
    }
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
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

  const handleSendOtp = async () => {
    const raw = phone.trim();
    if (!raw || raw.replace(/\D/g, '').length < 8) {
      setError('Ingresá un número válido (ej: 11 2233 4455)');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');

    try {
      const normalized = normalizePhone(raw);
      await storefrontAuthApi.sendOtp(normalized);
      setStep('otp');
      setInfo('¡Código enviado! Revisá tu WhatsApp.');
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
      const normalized = normalizePhone(phone);
      await storefrontAuthApi.sendOtp(normalized);
      setInfo('Nuevo código enviado.');
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
      const normalized = normalizePhone(phone);
      const result = await storefrontAuthApi.verifyOtp(normalized, code);
      setCustomer(result.customer);

      // Redirect to previous page or store catalog
      const from = (location.state as any)?.from || '/store';
      navigate(from, { replace: true });
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

    // Auto-submit when all 6 digits are filled
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

  const storeBase = location.pathname.startsWith('/store') ? '/store' : '/';

  return (
    <div style={styles.page}>
      {/* Background glows */}
      <div style={styles.glowOrb1} />
      <div style={styles.glowOrb2} />

      <div style={styles.card}>
        {/* Logo / Header */}
        <div style={styles.logoArea}>
          <div style={styles.waIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
          </div>
          <h1 style={styles.title}>Accedé a tu cuenta</h1>
          <p style={styles.subtitle}>Te enviamos un código por WhatsApp</p>
        </div>

        {/* Step indicator */}
        <div style={styles.stepIndicator}>
          <div style={stepDotStyle(step === 'phone')} />
          <div style={stepDotStyle(step === 'otp')} />
        </div>

        {/* Error / Info messages */}
        {error && <div style={styles.error}>⚠️ {error}</div>}
        {info && !error && <div style={styles.success}>✅ {info}</div>}

        {/* ── Step 1: Phone ── */}
        {step === 'phone' && (
          <div className="sf-step-enter">
            <label style={styles.label}>Tu número de WhatsApp</label>
            <div style={styles.phoneWrapper}>
              <div style={styles.prefix}>🇦🇷 +54</div>
              <input
                className="sf-input"
                type="tel"
                inputMode="tel"
                placeholder="11 2233 4455"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                style={styles.input}
                autoFocus
                autoComplete="tel"
              />
            </div>
            <p style={styles.hint}>
              Ingresá tu número sin el 0 inicial ni el 15.<br />
              Ejemplo: 11 2233 4455
            </p>

            <button
              className="sf-btn"
              onClick={handleSendOtp}
              disabled={loading}
              style={{
                ...styles.btn,
                ...(loading ? styles.btnDisabled : {}),
              }}
            >
              {loading ? 'Enviando...' : 'Enviar código por WhatsApp →'}
            </button>
          </div>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 'otp' && (
          <div className="sf-step-enter">
            <button
              className="sf-backbtn"
              style={styles.backBtn}
              onClick={() => { setStep('phone'); setError(''); setOtp(['', '', '', '', '', '']); }}
            >
              ← Cambiar número
            </button>

            <label style={{ ...styles.label, textAlign: 'center', display: 'block' }}>
              Ingresá el código de 6 dígitos
            </label>
            <p style={{ ...styles.hint, textAlign: 'center', marginBottom: '1rem' }}>
              Enviado al +54 {phone}
            </p>

            <div style={styles.otpGrid} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
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
                  style={otpBoxStyle(focusedOtp === i, digit !== '')}
                  aria-label={`Dígito ${i + 1}`}
                />
              ))}
            </div>

            <button
              className="sf-btn"
              onClick={() => handleVerifyOtp()}
              disabled={loading || otp.some((d) => d === '')}
              style={{
                ...styles.btn,
                ...(loading || otp.some((d) => d === '') ? styles.btnDisabled : {}),
              }}
            >
              {loading ? 'Verificando...' : 'Confirmar código'}
            </button>

            <div style={styles.timer}>
              {countdown > 0 ? (
                <>¿No llegó? Podés reenviar en <strong style={{ color: '#10b981' }}>{countdown}s</strong></>
              ) : (
                <button
                  style={styles.timerLink}
                  onClick={handleResendOtp}
                  disabled={loading}
                >
                  Reenviar código por WhatsApp
                </button>
              )}
            </div>
          </div>
        )}

        {/* Back to store link */}
        <div style={styles.storeLink}>
          <Link
            to={storeBase}
            style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}
          >
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
