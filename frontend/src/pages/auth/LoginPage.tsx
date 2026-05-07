import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Input  } from '@/components/ui/Input';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string }>({});

  const setAuth  = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  // Where to go after login — supports back-redirect from RequireAuth
  const intendedPath = (location.state as { from?: string })?.from ?? '/admin';

  const { mutate: login, isPending, isError } = useMutation({
    mutationFn: () => authApi.login({ email: email.trim(), password }),
    onSuccess: ({ user }) => {
      setAuth(user);
      const name = user.fullName ? user.fullName.split(' ')[0] : user.email.split('@')[0];
      toast.success(`Bienvenido, ${name}!`);
      navigate(intendedPath, { replace: true });
    },
    onError: (err: any) => {
      const msg: string = err?.response?.data?.message ?? '';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('credential')) {
        setFieldErr({ password: 'Contraseña incorrecta.' });
      } else if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('user')) {
        setFieldErr({ email: 'Email no registrado.' });
      }
      // Global toast already fired by apiClient interceptor for other errors
    },
  });

  // Clear field errors when user starts correcting
  useEffect(() => { setFieldErr((p) => ({ ...p, email: undefined }));   }, [email]);
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
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.heading}>
        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Ingresá tus credenciales para continuar</p>
      </div>

      {isError && !Object.keys(fieldErr).length && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>Email o contraseña incorrectos.</span>
        </div>
      )}

      <div className={styles.fields}>
        <Input
          id="login-email"
          label="Email"
          type="email"
          placeholder="admin@tienda.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={16} />}
          error={fieldErr.email}
          autoComplete="email"
          autoFocus
        />
        <Input
          id="login-password"
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={16} />}
          error={fieldErr.password}
          autoComplete="current-password"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        loading={isPending}
        className={styles.submit}
        id="btn-login"
      >
        {isPending ? 'Verificando…' : 'Ingresar'}
      </Button>
    </form>
  );
}
