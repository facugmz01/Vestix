import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Store,
  BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { PageContainer, Card, Input, Button, Modal } from '@/components/ui';
import { ROLE_LABELS } from '@/rbac/permissions';
import type { MfaSetupResponse } from '@/types';
import styles from './ProfilePage.module.css';

type Tab = 'profile' | 'security' | 'mfa';

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    tabParam === 'security' || tabParam === 'mfa' ? tabParam : 'profile',
  );

  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam === 'security' || tabParam === 'mfa' || tabParam === 'profile') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (t: Tab) => {
    setActiveTab(t);
    setSearchParams({ tab: t });
  };

  // ── Profile Form State ──
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    if (!email.trim()) {
      toast.error('El correo no puede estar vacío');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await authApi.updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      updateUser(res.user);
      toast.success('Perfil actualizado correctamente');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al actualizar el perfil';
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password Form State ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Ingresá tu contraseña actual');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (currentPassword === newPassword) {
      toast.error('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success('Contraseña modificada con éxito');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al cambiar la contraseña';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  // ── MFA Setup State ──
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<MfaSetupResponse | null>(null);
  const [generatingMfa, setGeneratingMfa] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyingMfa, setVerifyingMfa] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // ── MFA Disable State ──
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disablingMfa, setDisablingMfa] = useState(false);

  const startMfaSetup = async () => {
    setGeneratingMfa(true);
    try {
      const data = await authApi.generateMfa();
      setMfaSetupData(data);
      setVerifyCode('');
      setBackupCodes(null);
      setSetupModalOpen(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al iniciar configuración MFA');
    } finally {
      setGeneratingMfa(false);
    }
  };

  const handleVerifyAndEnableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim() || verifyCode.trim().length !== 6) {
      toast.error('Ingresá el código de 6 dígitos generado por tu app');
      return;
    }

    setVerifyingMfa(true);
    try {
      const res = await authApi.enableMfa(verifyCode.trim());
      updateUser({ mfaEnabled: true });
      setBackupCodes(res.backupCodes);
      toast.success('¡MFA activado exitosamente!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Código incorrecto o expirado');
    } finally {
      setVerifyingMfa(false);
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) {
      toast.error('Ingresá tu contraseña para deshabilitar MFA');
      return;
    }

    setDisablingMfa(true);
    try {
      await authApi.disableMfa(disablePassword);
      updateUser({ mfaEnabled: false });
      toast.success('Autenticación en dos pasos desactivada');
      setDisableModalOpen(false);
      setDisablePassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Contraseña incorrecta');
    } finally {
      setDisablingMfa(false);
    }
  };

  const copyToClipboard = (text: string, isSecret = false) => {
    navigator.clipboard.writeText(text);
    if (isSecret) {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
    toast.success('Copiado al portapapeles');
  };

  const downloadBackupCodes = () => {
    if (!backupCodes) return;
    const content = `Códigos de Recuperación MFA - Vestix ERP\nUsuario: ${user?.email}\nFecha: ${new Date().toLocaleString()}\n\n${backupCodes.join(
      '\n',
    )}\n\n* Cada código solo puede ser utilizado una única vez.`;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `vestix-mfa-backup-codes-${user?.email || 'user'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const roleLabel = user?.role ? (ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role) : '';
  const isMfaActive = Boolean(user?.mfaEnabled);

  return (
    <PageContainer title="Mi Cuenta" subtitle="Administrá tu perfil, credenciales de acceso y seguridad">
      <div className={styles.container}>
        {/* User Hero Banner */}
        <div className={styles.profileHero}>
          <div className={styles.heroAvatar} aria-hidden>
            {user?.fullName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className={styles.heroInfo}>
            <h1 className={styles.heroName}>
              {user?.fullName || 'Usuario'}
              <BadgeCheck size={20} color="var(--accent)" />
            </h1>
            <p className={styles.heroEmail}>{user?.email}</p>
            <div className={styles.heroBadges}>
              <span className={`${styles.badge} ${styles.badgeRole}`}>
                {roleLabel}
              </span>
              <span className={`${styles.badge} ${styles.badgeBranch}`}>
                <Store size={12} />
                {user?.branchId ? 'Sucursal Activa' : 'Casa Central'}
              </span>
              <span
                className={`${styles.badge} ${
                  isMfaActive ? styles.badgeMfaActive : styles.badgeMfaInactive
                }`}
              >
                {isMfaActive ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                {isMfaActive ? 'MFA Habilitado' : 'MFA Desactivado'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className={styles.tabsBar} aria-label="Secciones del perfil">
          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
          >
            <User size={16} /> Datos personales
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('security')}
            className={`${styles.tabBtn} ${activeTab === 'security' ? styles.tabBtnActive : ''}`}
          >
            <Lock size={16} /> Contraseña
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('mfa')}
            className={`${styles.tabBtn} ${activeTab === 'mfa' ? styles.tabBtnActive : ''}`}
          >
            <ShieldCheck size={16} /> Autenticación en 2 pasos (MFA)
          </button>
        </nav>

        {/* ── TAB 1: Edit Profile ── */}
        {activeTab === 'profile' && (
          <Card title="Información Personal" subtitle="Modificá tu información pública y de contacto">
            <form onSubmit={handleSaveProfile}>
              <div className={styles.formGrid}>
                <Input
                  label="Nombre y Apellido"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />
                <Input
                  label="Correo Electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
                <Input
                  label="Teléfono de contacto"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 11 2345 6789"
                />
                <div className={styles.readonlyField}>
                  <Input
                    label="Rol asignado"
                    value={roleLabel}
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <Button type="submit" variant="primary" loading={savingProfile}>
                  Guardar cambios
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── TAB 2: Change Password ── */}
        {activeTab === 'security' && (
          <Card
            title="Cambiar Contraseña"
            subtitle="Mantené tu cuenta segura actualizando tu contraseña periódicamente"
          >
            <form onSubmit={handleChangePassword}>
              <div className={styles.formGrid}>
                <div className={styles.fullWidthCol}>
                  <Input
                    label="Contraseña actual"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Tu contraseña actual"
                    required
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                </div>
                <Input
                  label="Nueva contraseña"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <Input
                  label="Confirmar nueva contraseña"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la nueva contraseña"
                  required
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              <div className={styles.formActions}>
                <Button type="submit" variant="primary" loading={savingPassword}>
                  Actualizar contraseña
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── TAB 3: MFA (Two-Factor Authentication) ── */}
        {activeTab === 'mfa' && (
          <Card
            title="Autenticación de Dos Factores (MFA / 2FA)"
            subtitle="Protegé tu cuenta requiriendo un código de tu app autenticadora en cada inicio de sesión"
          >
            {isMfaActive ? (
              <div>
                <div className={`${styles.mfaBanner} ${styles.mfaBannerActive}`}>
                  <ShieldCheck size={28} className={styles.mfaIconActive} />
                  <div className={styles.mfaContent}>
                    <p className={styles.mfaTitle}>Tu cuenta está protegida con MFA</p>
                    <p className={styles.mfaDesc}>
                      La autenticación de dos factores está activa. Cada vez que inicies sesión se te
                      solicitará un código generado por tu aplicación móvil (Google Authenticator,
                      Microsoft Authenticator, 1Password, Authy) o un código de respaldo.
                    </p>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => {
                      setDisablePassword('');
                      setDisableModalOpen(true);
                    }}
                  >
                    Desactivar MFA
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className={`${styles.mfaBanner} ${styles.mfaBannerInactive}`}>
                  <ShieldAlert size={28} className={styles.mfaIconInactive} />
                  <div className={styles.mfaContent}>
                    <p className={styles.mfaTitle}>La autenticación en dos factores no está activa</p>
                    <p className={styles.mfaDesc}>
                      Activá la verificación en dos pasos (TOTP) para evitar accesos no autorizados a tu
                      cuenta incluso si tu contraseña llega a verse comprometida.
                    </p>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <Button
                    type="button"
                    variant="primary"
                    loading={generatingMfa}
                    onClick={startMfaSetup}
                  >
                    <ShieldCheck size={16} style={{ marginRight: '6px' }} />
                    Configurar Autenticación en 2 Pasos
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ── Setup MFA Modal ── */}
      <Modal
        open={setupModalOpen}
        title={backupCodes ? '¡MFA Habilitado con Éxito!' : 'Configurar Autenticación en 2 Pasos'}
        onClose={() => {
          if (!verifyingMfa) {
            setSetupModalOpen(false);
            setBackupCodes(null);
          }
        }}
        size="md"
      >
        {backupCodes ? (
          <div>
            <div className={styles.alertWarning}>
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Guardá estos códigos de respaldo en un lugar seguro.</strong>
                <br />
                Si perdés tu teléfono o tu aplicación autenticadora, estos códigos son la única forma
                de acceder a tu cuenta. Cada código puede utilizarse una sola vez.
              </div>
            </div>

            <div className={styles.backupGrid}>
              {backupCodes.map((code, index) => (
                <div key={index} className={styles.backupCode}>
                  {code}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
              >
                {copiedCodes ? <Check size={14} /> : <Copy size={14} />}
                {copiedCodes ? 'Copiados' : 'Copiar todos'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                fullWidth
                onClick={downloadBackupCodes}
              >
                <Download size={14} /> Descargar .txt
              </Button>
            </div>

            <div className={styles.modalFooterBtns}>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setSetupModalOpen(false);
                  setBackupCodes(null);
                }}
              >
                Entendido y Finalizar
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className={styles.mfaDesc}>
              Escaneá el código QR utilizando tu app autenticadora preferida (Google Authenticator,
              Microsoft Authenticator, Authy, etc.):
            </p>

            {mfaSetupData && (
              <div className={styles.qrWrapper}>
                <img
                  src={mfaSetupData.qrCode}
                  alt="Código QR para MFA"
                  className={styles.qrImage}
                />

                <div className={styles.secretBox}>
                  <span className={styles.secretText} title={mfaSetupData.secret}>
                    {mfaSetupData.secret}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(mfaSetupData.secret, true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    title="Copiar clave secreta"
                  >
                    {copiedSecret ? <Check size={16} color="var(--accent)" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyAndEnableMfa}>
              <p className={styles.stepHeading}>
                <span className={styles.stepNumber}>2</span>
                Ingresá el código de 6 dígitos que muestra tu app:
              </p>

              <Input
                type="text"
                placeholder="Ej: 123456"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                maxLength={6}
                autoFocus
                required
              />

              <div className={styles.modalFooterBtns} style={{ marginTop: '20px' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSetupModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={verifyingMfa}
                >
                  Verificar y Activar
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ── Disable MFA Modal ── */}
      <Modal
        open={disableModalOpen}
        title="Desactivar Autenticación en 2 Pasos"
        onClose={() => setDisableModalOpen(false)}
        size="sm"
      >
        <form onSubmit={handleDisableMfa}>
          <p className={styles.mfaDesc} style={{ marginBottom: '16px' }}>
            Para desactivar la protección MFA, ingresá tu contraseña actual por seguridad:
          </p>

          <Input
            label="Contraseña actual"
            type="password"
            placeholder="••••••••"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            autoFocus
            required
          />

          <div className={styles.modalFooterBtns} style={{ marginTop: '20px' }}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDisableModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={disablingMfa}
            >
              Confirmar Desactivación
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
