import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string }>({});

  // MFA challenge state
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaToken, setMfaToken]   = useState('');
  const [mfaCode, setMfaCode]     = useState('');
  const [mfaError, setMfaError]   = useState('');

  const setAuth  = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const intendedPath = (location.state as { from?: string })?.from ?? '/admin';

  const { mutate: login, isPending, isError } = useMutation({
    mutationFn: () => authApi.login({ email: email.trim(), password }),
    onSuccess: (data) => {
      if (data.mfaRequired && data.mfaToken) {
        setMfaToken(data.mfaToken);
        setIsMfaStep(true);
        setMfaCode('');
        setMfaError('');
        toast('Ingresá tu código de verificación (MFA)', { icon: '🔐' });
        return;
      }
      if (data.user) {
        setAuth(data.user);
        const name = data.user.fullName ? data.user.fullName.split(' ')[0] : data.user.email.split('@')[0];
        toast.success(`¡Bienvenido, ${name}!`);
        navigate(intendedPath, { replace: true });
      }
    },
    onError: (err: unknown) => {
      const msg: string = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('credential')) {
        setFieldErr({ password: 'Contraseña incorrecta.' });
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('user')) {
        setFieldErr({ email: 'Email no registrado.' });
      }
    },
  });

  const { mutate: verifyMfa, isPending: isMfaPending } = useMutation({
    mutationFn: () => authApi.loginMfa({ mfaToken, code: mfaCode.trim() }),
    onSuccess: ({ user }) => {
      setAuth(user);
      const name = user.fullName ? user.fullName.split(' ')[0] : user.email.split('@')[0];
      toast.success(`¡Bienvenido, ${name}!`);
      navigate(intendedPath, { replace: true });
    },
    onError: (err: unknown) => {
      const msg: string = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '';
      setMfaError(msg || 'Código de autenticación incorrecto o expirado.');
    },
  });

  useEffect(() => { setFieldErr((p) => ({ ...p, email: undefined })); }, [email]);
  useEffect(() => { setFieldErr((p) => ({ ...p, password: undefined })); }, [password]);

  const validate = (): boolean => {
    const errors: typeof fieldErr = {};
    if (!email.trim()) errors.email = 'El email es requerido.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido.';
    if (!password) errors.password = 'La contraseña es requerida.';
    setFieldErr(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMfaStep) {
      if (!mfaCode.trim()) {
        setMfaError('Ingresá el código de verificación o código de respaldo.');
        return;
      }
      verifyMfa();
    } else {
      if (validate()) login();
    }
  };

  const handleBackToLogin = () => {
    setIsMfaStep(false);
    setMfaToken('');
    setMfaCode('');
    setMfaError('');
  };

  return (
    <div className={styles.form}>
      <div className={styles.heading}>
        <h1 className={styles.title}>
          {isMfaStep ? 'Verificación en 2 pasos' : 'Iniciar sesión'}
        </h1>
        <p className={styles.subtitle}>
          {isMfaStep
            ? 'Ingresá el código de tu app autenticadora o un código de respaldo'
            : 'Ingresá tus credenciales para continuar'}
        </p>
      </div>

      {!isMfaStep && isError && !Object.keys(fieldErr).length && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} />
          <span>Email o contraseña incorrectos.</span>
        </div>
      )}

      {isMfaStep && mfaError && (
        <div className={styles.errorBanner} role="alert">
          <AlertCircle size={16} />
          <span>{mfaError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.fields}>
          {isMfaStep ? (
            <Input
              label="Código de seguridad (6 dígitos o de respaldo)"
              type="text"
              placeholder="Ej: 123456 o A1B2-C3D4"
              value={mfaCode}
              onChange={(e) => {
                setMfaCode(e.target.value);
                setMfaError('');
              }}
              leftIcon={<ShieldCheck size={16} />}
              autoComplete="one-time-code"
              autoFocus
            />
          ) : (
            <>
              <Input
                label="Email"
                type="email"
                placeholder="admin@tienda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErr.email}
                leftIcon={<Mail size={16} />}
                autoComplete="email"
                autoFocus
              />

              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErr.password}
                leftIcon={<Lock size={16} />}
                autoComplete="current-password"
              />
            </>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isMfaStep ? isMfaPending : isPending}
          className={styles.submit}
        >
          {isMfaStep
            ? (isMfaPending ? 'Verificando código…' : 'Verificar e Ingresar')
            : (isPending ? 'Verificando…' : 'Ingresar')}
        </Button>

        {isMfaStep && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            fullWidth
            onClick={handleBackToLogin}
            style={{ marginTop: '8px' }}
          >
            <ArrowLeft size={15} style={{ marginRight: '6px' }} /> Volver al login
          </Button>
        )}
      </form>
    </div>
  );
}
