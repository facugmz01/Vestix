import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { APP_CONFIG } from '@/config/app.config';
import { getDefaultHomePath } from '@/rbac/homeRoute';

export default function LoginPage() {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [fieldErr,    setFieldErr]    = useState<{ email?: string; password?: string }>({});
  const [mounted,     setMounted]     = useState(false);

  const setAuth  = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const intendedPath = (location.state as { from?: string })?.from;

  useEffect(() => { setMounted(true); }, []);

  const { mutate: login, isPending, isError } = useMutation({
    mutationFn: () => authApi.login({ email: email.trim(), password }),
    onSuccess: ({ user }) => {
      setAuth(user);
      const name = user.fullName ? user.fullName.split(' ')[0] : user.email.split('@')[0];
      toast.success(`¡Bienvenido, ${name}!`);
      const target = intendedPath && intendedPath !== '/admin' && intendedPath !== '/'
        ? intendedPath
        : getDefaultHomePath(user);
      navigate(target, { replace: true });
    },
    onError: (err: any) => {
      const msg: string = err?.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('credential')) {
        setFieldErr({ password: 'Contraseña incorrecta.' });
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('user')) {
        setFieldErr({ email: 'Email no registrado.' });
      }
    },
  });

  useEffect(() => { setFieldErr((p) => ({ ...p, email: undefined }));    }, [email]);
  useEffect(() => { setFieldErr((p) => ({ ...p, password: undefined })); }, [password]);

  const validate = (): boolean => {
    const errors: typeof fieldErr = {};
    if (!email.trim())    errors.email    = 'El email es requerido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido.';
    if (!password)        errors.password = 'La contraseña es requerida.';
    setFieldErr(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) login();
  };

  return (
    <>
      {/* ── Global override styles injected inline ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        #login-root-page {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
          background: #e8eaf6;
        }

        /* Animated gradient background */
        #login-bg-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            #ede9fe 0%,
            #e0e7ff 40%,
            #fce7f3 100%
          );
          animation: bgShift 14s ease-in-out infinite alternate;
        }

        @keyframes bgShift {
          0%   { background: linear-gradient(135deg, #ede9fe 0%, #e0e7ff 40%, #fce7f3 100%); }
          50%  { background: linear-gradient(135deg, #e0f2fe 0%, #ede9fe 50%, #fce7f3 100%); }
          100% { background: linear-gradient(135deg, #f0fdf4 0%, #e0e7ff 50%, #ede9fe 100%); }
        }

        /* Floating orbs */
        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          animation: orbFloat 18s ease-in-out infinite alternate;
        }

        .login-orb-1 {
          width: 500px; height: 500px;
          background: rgba(139, 92, 246, 0.25);
          top: -15%; left: -10%;
          animation-duration: 22s;
        }

        .login-orb-2 {
          width: 400px; height: 400px;
          background: rgba(99, 102, 241, 0.2);
          bottom: -15%; right: -10%;
          animation-delay: -8s;
          animation-duration: 18s;
        }

        .login-orb-3 {
          width: 300px; height: 300px;
          background: rgba(236, 72, 153, 0.15);
          top: 50%; left: 60%;
          animation-delay: -4s;
          animation-duration: 25s;
        }

        @keyframes orbFloat {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(4%, 8%) scale(1.08); }
          66%  { transform: translate(-4%, 4%) scale(0.94); }
          100% { transform: translate(2%, -6%) scale(1.04); }
        }

        /* Subtle grid overlay */
        #login-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        /* Card */
        #login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          margin: 16px;
          background: rgba(255, 255, 255, 0.60);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.75);
          border-radius: 28px;
          padding: 48px 40px;
          box-shadow:
            0 24px 64px rgba(99, 102, 241, 0.12),
            0 8px 32px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.95);
          transform: ${mounted ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.96)'};
          opacity: ${mounted ? '1' : '0'};
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease;
        }

        /* Logo area */
        #login-logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
          margin-bottom: 36px;
        }

        #login-logo-mark {
          width: 46px; height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%);
          box-shadow: 0 8px 32px rgba(99, 60, 237, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #login-logo-mark svg {
          width: 24px; height: 24px;
          fill: white;
        }

        #login-brand-name {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #1e1b4b;
        }

        /* Heading */
        #login-heading {
          text-align: center;
          margin-bottom: 32px;
        }

        #login-title {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #1e1b4b;
          margin: 0 0 8px;
          line-height: 1.1;
        }

        #login-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          font-weight: 400;
        }

        /* Error banner */
        #login-error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #dc2626;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 24px;
          animation: loginShake 0.4s ease;
        }

        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          20%, 60%  { transform: translateX(-5px); }
          40%, 80%  { transform: translateX(5px); }
        }

        /* Fields */
        #login-fields {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 28px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .login-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.01em;
        }

        .login-input-row {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 16px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.2s;
        }

        .login-input-eye {
          position: absolute;
          right: 14px;
          color: #9ca3af;
          display: flex;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.2s;
        }
        .login-input-eye:hover { color: #6d28d9; }

        .login-input {
          width: 100%;
          padding: 14px 16px 14px 46px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 14px;
          color: #1e1b4b;
          font-size: 15px;
          font-family: 'Inter', system-ui, sans-serif;
          outline: none;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
          -webkit-autofill: unset;
        }

        .login-input::placeholder {
          color: #d1d5db;
        }

        .login-input:focus {
          border-color: rgba(109, 40, 217, 0.5);
          background: rgba(255, 255, 255, 0.9);
          box-shadow: 0 0 0 4px rgba(109, 40, 217, 0.1);
        }

        .login-input-row:focus-within .login-input-icon {
          color: #6d28d9;
        }

        .login-input.has-error {
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(254, 242, 242, 0.9);
        }

        .login-input.has-error:focus {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
        }

        .login-input-pass { padding-right: 48px; }

        .login-field-error {
          font-size: 12px;
          color: #dc2626;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* Submit button */
        #login-submit {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #2563eb 100%);
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          font-family: 'Inter', system-ui, sans-serif;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, opacity 0.2s;
          box-shadow: 0 8px 32px rgba(99, 60, 237, 0.45);
          position: relative;
          overflow: hidden;
        }

        #login-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
        }

        #login-submit:not(:disabled):hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 16px 48px rgba(99, 60, 237, 0.55);
        }

        #login-submit:not(:disabled):active {
          transform: translateY(0) scale(0.99);
          box-shadow: 0 4px 16px rgba(99, 60, 237, 0.4);
        }

        #login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: loginSpin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes loginSpin { to { transform: rotate(360deg); } }

        /* Footer */
        #login-footer {
          text-align: center;
          margin-top: 28px;
          font-size: 12px;
          color: #9ca3af;
          font-weight: 500;
        }

        /* Chrome autofill override */
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.95) inset !important;
          -webkit-text-fill-color: #1e1b4b !important;
          border-color: rgba(109, 40, 217, 0.5) !important;
          caret-color: #1e1b4b !important;
        }

        /* Mobile */
        @media (max-width: 480px) {
          #login-card {
            padding: 36px 24px;
            border-radius: 24px;
            margin: 12px;
          }
          #login-title { font-size: 26px; }
          #login-submit { padding: 15px; font-size: 15px; }
        }
      `}</style>

      {/* ── Page shell ── */}
      <div id="login-root-page">
        <div id="login-bg-gradient" />
        <div id="login-grid" />
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />

        <div id="login-card">

          {/* Logo */}
          <div id="login-logo-row">
            <div id="login-logo-mark">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span id="login-brand-name">{APP_CONFIG.appName}</span>
          </div>

          {/* Heading */}
          <div id="login-heading">
            <h1 id="login-title">Iniciar sesión</h1>
            <p id="login-subtitle">Ingresá tus credenciales para continuar</p>
          </div>

          {/* Error banner */}
          {isError && !Object.keys(fieldErr).length && (
            <div id="login-error-banner">
              <AlertCircle size={16} />
              <span>Email o contraseña incorrectos.</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div id="login-fields">

              {/* Email */}
              <div className="login-field">
                <label className="login-label" htmlFor="login-email">Email</label>
                <div className="login-input-row">
                  <span className="login-input-icon"><Mail size={16} /></span>
                  <input
                    id="login-email"
                    className={`login-input${fieldErr.email ? ' has-error' : ''}`}
                    type="email"
                    placeholder="admin@tienda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
                {fieldErr.email && (
                  <span className="login-field-error">
                    <AlertCircle size={12} />{fieldErr.email}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="login-field">
                <label className="login-label" htmlFor="login-password">Contraseña</label>
                <div className="login-input-row">
                  <span className="login-input-icon"><Lock size={16} /></span>
                  <input
                    id="login-password"
                    className={`login-input login-input-pass${fieldErr.password ? ' has-error' : ''}`}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-input-eye"
                    onClick={() => setShowPass((p) => !p)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErr.password && (
                  <span className="login-field-error">
                    <AlertCircle size={12} />{fieldErr.password}
                  </span>
                )}
              </div>

            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isPending}
            >
              {isPending && <span className="login-spinner" />}
              {isPending ? 'Verificando…' : 'Ingresar'}
            </button>
          </form>

          <div id="login-footer">v{APP_CONFIG.appVersion}</div>
        </div>
      </div>
    </>
  );
}
