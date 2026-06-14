import { useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Building2, Upload, Globe, ExternalLink, Copy } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { settingsApi, SystemSettings } from '@/api/settings.api';
import { useFormContext } from 'react-hook-form';
import { SettingsSection, SettingsRow, SettingsDivider } from './SettingsLayout';

const TIMEZONES = ['America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Santiago', 'America/Lima', 'America/Mexico_City'];

export function GeneralSettingsPanel() {
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, formState: { errors }, watch, setValue } = useFormContext<SystemSettings>();
  const logoUrl = watch('general.logoUrl');

  const logoMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file),
    onSuccess: (data) => {
      setValue('general.logoUrl', data.logoUrl, { shouldDirty: true });
      toast.success('Logo actualizado');
    },
    onError: () => toast.error('Error al subir logo'),
  });

  return (
    <SettingsSection title="Datos de la Empresa" description="Información fiscal y de contacto visible en documentos e impresiones.">

      <SettingsRow label="Logo de la Empresa" hint="Formato PNG/JPG, máx. 2MB.">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {logoUrl
            ? <img src={logoUrl} alt="Logo" style={{ height: '56px', borderRadius: '8px', border: '1px solid var(--border)', objectFit: 'contain', background: '#fff' }} />
            : <div style={{ width: '80px', height: '56px', borderRadius: '8px', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={24} color="var(--text-muted)" /></div>
          }
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) logoMutation.mutate(e.target.files[0]); }} />
          <Button variant="outline" size="sm" icon={<Upload size={14} />} onClick={() => fileRef.current?.click()} loading={logoMutation.isPending}>
            Subir Logo
          </Button>
        </div>
      </SettingsRow>

      <SettingsDivider />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Input label="Nombre Comercial *" {...register('general.companyName', { required: 'Requerido' })} error={errors.general?.companyName?.message} />
        <Input label="Razón Social *" {...register('general.legalName', { required: 'Requerido' })} error={errors.general?.legalName?.message} />
        <Input label="CUIT *" {...register('general.taxId', { required: 'Requerido', pattern: { value: /^\d{2}-\d{8}-\d$/, message: 'Formato: 20-12345678-9' } })} error={errors.general?.taxId?.message} placeholder="20-12345678-9" />
        <Input label="Teléfono" {...register('general.phone')} />
        <Input label="Email de contacto" type="email" {...register('general.email', { required: 'Requerido' })} error={errors.general?.email?.message} />
        <Input label="Sitio Web" {...register('general.website')} placeholder="https://..." />
      </div>

      <SettingsDivider />

      {/* ── Storefront URL ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <Globe size={16} color="var(--accent)" />
          <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>URL Pública de la Tienda Web</p>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Dirección donde tus clientes acceden al catálogo online. Si el ERP está en <code style={{ background: 'var(--bg-overlay)', padding: '1px 5px', borderRadius: '4px' }}>https://erp.miempresa.com</code>, la tienda suele ser <code style={{ background: 'var(--bg-overlay)', padding: '1px 5px', borderRadius: '4px' }}>https://erp.miempresa.com/store</code>.
        </p>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              label="URL de la Tienda Online"
              {...register('general.storefrontUrl')}
              placeholder="https://erp.tudominio.com/store"
            />
          </div>
          {watch('general.storefrontUrl') && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={<ExternalLink size={14} />}
                onClick={() => window.open(watch('general.storefrontUrl'), '_blank')}
              >
                Abrir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Copy size={14} />}
                onClick={() => {
                  navigator.clipboard.writeText(watch('general.storefrontUrl') || '');
                  toast.success('URL copiada al portapapeles');
                }}
              >
                Copiar
              </Button>
            </>
          )}
        </div>

        {watch('general.storefrontUrl') && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px',
            background: 'rgba(99,102,241,0.07)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '10px',
          }}>
            <Globe size={18} color="var(--accent)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Tienda configurada en:</p>
              <a
                href={watch('general.storefrontUrl')}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', wordBreak: 'break-all' }}
              >
                {watch('general.storefrontUrl')}
              </a>
            </div>
          </div>
        )}
      </div>

      <SettingsDivider />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Input label="Dirección" {...register('general.address')} />
        <Input label="Ciudad" {...register('general.city')} />
        <Input label="Provincia / Estado" {...register('general.province')} />
        <Input label="País" {...register('general.country')} />
      </div>

      <SettingsDivider />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Zona Horaria</label>
          <select {...register('general.timezone')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}>
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Moneda</label>
          <select {...register('general.currency')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}>
            <option value="ARS">ARS — Peso Argentino</option>
            <option value="USD">USD — Dólar</option>
            <option value="CLP">CLP — Peso Chileno</option>
          </select>
        </div>
      </div>

    </SettingsSection>
  );
}
