import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Building2,
  Check,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Hash,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { setupApi } from '@/api/setup.api';
import type { CreateAdminDto, CompanyInfoDto } from '@/api/setup.api';
import { PageSpinner } from '@/components/ui/Spinner';
import s from './SetupWizardPage.module.css';

// ─── Validation helpers ───────────────────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

type FieldErrors = Record<string, string>;

function validateAdmin(data: CreateAdminDto & { confirmPassword: string }): FieldErrors {
  const e: FieldErrors = {};
  if (!data.fullName.trim()) e.fullName = 'El nombre es obligatorio';
  if (!data.email.trim()) e.email = 'El email es obligatorio';
  else if (!isValidEmail(data.email)) e.email = 'Email inválido';
  if (!data.password) e.password = 'La contraseña es obligatoria';
  else if (data.password.length < 6) e.password = 'Mínimo 6 caracteres';
  if (data.password !== data.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
  return e;
}

function validateCompany(data: CompanyInfoDto): FieldErrors {
  const e: FieldErrors = {};
  if (!data.companyName.trim()) e.companyName = 'El nombre de la empresa es obligatorio';
  if (data.email && !isValidEmail(data.email)) e.email = 'Email inválido';
  return e;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SetupWizardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0=welcome, 1=admin, 2=company, 3=done
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');

  // Admin form
  const [fullName, setFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Company form
  const [companyName, setCompanyName] = useState('');
  const [cuit, setCuit] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  // ── Check setup status on mount ──
  useEffect(() => {
    setupApi
      .getStatus()
      .then(({ isInitialized }) => {
        if (isInitialized) {
          navigate('/login', { replace: true });
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, [navigate]);

  // ── Handlers ──
  const handleAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError('');
    const data = { fullName, email: adminEmail, password, confirmPassword };
    const fieldErrors = validateAdmin(data);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      await setupApi.createAdmin({ fullName, email: adminEmail, password });
      setStep(2);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Error al crear administrador';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompanySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError('');
    const data: CompanyInfoDto = {
      companyName,
      cuit: cuit || undefined,
      address: address || undefined,
      phone: phone || undefined,
      email: companyEmail || undefined,
    };
    const fieldErrors = validateCompany(data);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setSubmitting(true);
    try {
      await setupApi.saveCompany(data);
      setStep(3);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Error al guardar datos de empresa';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSpinner />;

  // ── Step indicator ──
  const stepLabels = ['Inicio', 'Admin', 'Empresa'];
  const renderSteps = () => (
    <div className={s.steps}>
      {stepLabels.map((label, i) => {
        const isCompleted = step > i;
        const isActive = step === i;
        return (
          <div key={label} className={s.stepGroup}>
            {i > 0 && (
              <div className={`${s.stepLine} ${step > i ? s.completed : ''}`} />
            )}
            <div
              className={`${s.stepDot} ${isActive ? s.active : ''} ${isCompleted ? s.completed : ''}`}
            >
              {isCompleted ? <Check size={16} /> : i + 1}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Step content ──
  const renderContent = () => {
    switch (step) {
      // ── Welcome ──
      case 0:
        return (
          <div className={s.stepContent} key="welcome">
            <div className={s.welcomeIcon}>
              <Shield size={36} />
            </div>
            <div className={s.heading}>
              <h1 className={s.title}>Bienvenido a Vestix ERP</h1>
              <p className={s.subtitle}>Configurá tu sistema en pocos pasos</p>
            </div>
            <ul className={s.featureList}>
              <li className={s.featureItem}>
                <Check size={18} /> Creá tu cuenta de Super Administrador
              </li>
              <li className={s.featureItem}>
                <Check size={18} /> Configurá los datos de tu empresa
              </li>
              <li className={s.featureItem}>
                <Check size={18} /> Empezá a gestionar tu negocio
              </li>
            </ul>
            <div className={s.actions}>
              <Button onClick={() => setStep(1)} icon={<ArrowRight size={16} />}>
                Comenzar
              </Button>
            </div>
          </div>
        );

      // ── Create Admin ──
      case 1:
        return (
          <form className={s.stepContent} key="admin" onSubmit={handleAdminSubmit}>
            <div className={s.heading}>
              <h1 className={s.title}>Crear Super Administrador</h1>
              <p className={s.subtitle}>
                Esta cuenta tendrá control total sobre el sistema
              </p>
            </div>

            {apiError && (
              <div className={s.errorBanner}>
                <AlertCircle size={16} /> {apiError}
              </div>
            )}

            <div className={s.fields}>
              <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={<User size={16} />}
                error={errors.fullName}
                autoFocus
                autoComplete="name"
              />
              <Input
                label="Email"
                type="email"
                placeholder="admin@tuempresa.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
                error={errors.email}
                autoComplete="email"
              />
              <Input
                label="Contraseña"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={16} />}
                error={errors.password}
                autoComplete="new-password"
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="Repetí la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock size={16} />}
                error={errors.confirmPassword}
                autoComplete="new-password"
              />
            </div>

            <div className={s.actions}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => { setStep(0); setErrors({}); setApiError(''); }}
                icon={<ArrowLeft size={16} />}
              >
                Atrás
              </Button>
              <Button type="submit" loading={submitting} icon={<ArrowRight size={16} />}>
                Siguiente
              </Button>
            </div>
          </form>
        );

      // ── Company Info ──
      case 2:
        return (
          <form className={s.stepContent} key="company" onSubmit={handleCompanySubmit}>
            <div className={s.heading}>
              <h1 className={s.title}>Datos de tu Empresa</h1>
              <p className={s.subtitle}>
                Estos datos se usarán en facturas y documentos
              </p>
            </div>

            {apiError && (
              <div className={s.errorBanner}>
                <AlertCircle size={16} /> {apiError}
              </div>
            )}

            <div className={s.fields}>
              <Input
                label="Nombre de la empresa"
                placeholder="Mi Empresa S.A."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                leftIcon={<Building2 size={16} />}
                error={errors.companyName}
                autoFocus
              />
              <Input
                label="CUIT"
                placeholder="20-12345678-9"
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                leftIcon={<Hash size={16} />}
                error={errors.cuit}
              />
              <Input
                label="Dirección"
                placeholder="Av. Corrientes 1234, CABA"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                leftIcon={<MapPin size={16} />}
                error={errors.address}
              />
              <Input
                label="Teléfono"
                placeholder="+54 11 1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone size={16} />}
                error={errors.phone}
              />
              <Input
                label="Email de la empresa"
                type="email"
                placeholder="info@tuempresa.com"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
                error={errors.email}
              />
            </div>

            <div className={s.actions}>
              <Button
                variant="secondary"
                type="button"
                onClick={() => { setErrors({}); setApiError(''); }}
                disabled
              >
                <ArrowLeft size={16} /> Atrás
              </Button>
              <Button type="submit" loading={submitting} icon={<ArrowRight size={16} />}>
                Finalizar
              </Button>
            </div>
          </form>
        );

      // ── Done ──
      case 3:
        return (
          <div className={s.stepContent} key="done">
            <div className={s.successIcon}>
              <Check size={40} />
            </div>
            <div className={s.heading}>
              <h1 className={s.title}>¡Todo listo!</h1>
              <p className={s.subtitle}>
                Tu sistema Vestix ERP está configurado y listo para usar
              </p>
            </div>

            <div className={s.successDetail}>
              <div className={s.successLabel}>Administrador creado</div>
              <div className={s.successValue}>{adminEmail}</div>
            </div>

            <div className={s.actions}>
              <Button onClick={() => navigate('/login', { replace: true })} icon={<ArrowRight size={16} />}>
                Ir al Login
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={s.shell}>
      <div className={s.brand}>
        <div className={s.logoMark} />
        <span className={s.brandName}>Vestix</span>
      </div>

      <div className={s.card}>
        {step < 3 && renderSteps()}
        {renderContent()}
      </div>

      <p className={s.footer}>Vestix ERP — Sistema de gestión integral</p>
    </div>
  );
}
