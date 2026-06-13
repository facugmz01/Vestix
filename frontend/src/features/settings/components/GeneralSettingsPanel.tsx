import { useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Building2, Upload } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { settingsApi, type GeneralSettings } from '@/api/settings.api';
import { queryKeys } from '@/api/queryKeys';
import { useSettingsSection } from '../hooks/useSettingsSection';
import { SettingsSection, SettingsRow, SettingsDivider } from './SettingsLayout';

const TIMEZONES = ['America/Argentina/Buenos_Aires', 'America/Bogota', 'America/Santiago', 'America/Lima', 'America/Mexico_City'];

export function GeneralSettingsPanel() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { form, onSubmit, isSaving, isLoading } = useSettingsSection<GeneralSettings>({
    key: 'general',
    queryFn: () => settingsApi.getSettings().then(d => d.general),
    mutateFn: settingsApi.updateGeneral,
  });
  const { register, formState: { errors }, watch } = form;
  const logoUrl = watch('logoUrl');

  const logoMutation = useMutation({
    mutationFn: (file: File) => settingsApi.uploadLogo(file),
    onSuccess: (data) => {
      form.setValue('logoUrl', data.logoUrl);
      toast.success('Logo actualizado');
      qc.invalidateQueries({ queryKey: [queryKeys.settings.get()] });
    },
    onError: () => toast.error('Error al subir logo'),
  });

  if (isLoading) return <p style={{ color: 'var(--text-muted)', padding: '24px' }}>Cargando...</p>;

  return (
    <SettingsSection title="Datos de la Empresa" description="Información fiscal y de contacto visible en documentos e impresiones." onSave={onSubmit} isSaving={isSaving}>

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
        <Input label="Nombre Comercial *" {...register('companyName', { required: 'Requerido' })} error={errors.companyName?.message} />
        <Input label="Razón Social *" {...register('legalName', { required: 'Requerido' })} error={errors.legalName?.message} />
        <Input label="CUIT *" {...register('taxId', { required: 'Requerido', pattern: { value: /^\d{2}-\d{8}-\d$/, message: 'Formato: 20-12345678-9' } })} error={errors.taxId?.message} placeholder="20-12345678-9" />
        <Input label="Teléfono" {...register('phone')} />
        <Input label="Email de contacto" type="email" {...register('email', { required: 'Requerido' })} error={errors.email?.message} />
        <Input label="Sitio Web" {...register('website')} placeholder="https://..." />
      </div>

      <SettingsDivider />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Input label="Dirección" {...register('address')} />
        <Input label="Ciudad" {...register('city')} />
        <Input label="Provincia / Estado" {...register('province')} />
        <Input label="País" {...register('country')} defaultValue="Argentina" />
      </div>

      <SettingsDivider />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Zona Horaria</label>
          <select {...register('timezone')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}>
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600 }}>Moneda</label>
          <select {...register('currency')} style={{ padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '14px' }}>
            <option value="ARS">ARS — Peso Argentino</option>
            <option value="USD">USD — Dólar</option>
            <option value="CLP">CLP — Peso Chileno</option>
          </select>
        </div>
      </div>

    </SettingsSection>
  );
}
