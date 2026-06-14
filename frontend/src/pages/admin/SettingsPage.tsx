import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Building2, Tag, Barcode, FileText, Bell, Plug, WifiOff, ChevronRight, Save
} from 'lucide-react';

import { 
  PageContainer, Button
} from '@/components/ui';
import { ActionGuard } from '@/rbac/ActionGuard';
import { settingsApi, SystemSettings } from '@/api/settings.api';
import { queryKeys } from '@/api/queryKeys';

import { GeneralSettingsPanel } from '@/features/settings/components/GeneralSettingsPanel';
import {
  PricingSettingsPanel, SkuBarcodeSettingsPanel,
  InvoicingSettingsPanel, OfflineSettingsPanel
} from '@/features/settings/components/OtherSettingsPanels';
import {
  NotificationSettingsPanel, IntegrationSettingsPanel
} from '@/features/settings/components/CommsSettingsPanels';

type SettingsTab =
  | 'general'
  | 'pricing'
  | 'skuBarcode'
  | 'invoicing'
  | 'notifications'
  | 'integrations'
  | 'offline';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'general',       label: 'Empresa',          icon: <Building2 size={16} />, description: 'Datos fiscales y logo' },
  { id: 'pricing',       label: 'Precios',           icon: <Tag size={16} />,       description: 'IVA, descuentos, redondeo' },
  { id: 'skuBarcode',   label: 'SKU / Barcode',     icon: <Barcode size={16} />,   description: 'Generación automática' },
  { id: 'invoicing',     label: 'Facturación AFIP',  icon: <FileText size={16} />,  description: 'Punto de venta, ambiente' },
  { id: 'notifications', label: 'Notificaciones',    icon: <Bell size={16} />,      description: 'Canales y eventos' },
  { id: 'integrations',  label: 'Integraciones',     icon: <Plug size={16} />,      description: 'Activar/desactivar conectores' },
  { id: 'offline',       label: 'Modo Offline',      icon: <WifiOff size={16} />,   description: 'Estrategia y cola' },
];

/**
 * Extracts only the 7 valid settings sections from a raw API response,
 * stripping out Prisma metadata fields like `id` and `updatedAt` that
 * would cause a 400 from the backend's forbidNonWhitelisted validation.
 */
function sanitizeSettings(raw: any): SystemSettings {
  return {
    general:       raw?.general       ?? {},
    pricing:       raw?.pricing       ?? {},
    skuBarcode:    raw?.skuBarcode    ?? {},
    invoicing:     raw?.invoicing     ?? {},
    notifications: raw?.notifications ?? {},
    integrations:  raw?.integrations  ?? {},
    offline:       raw?.offline       ?? {},
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const qc = useQueryClient();

  const { data: rawSettings, isLoading } = useQuery({
    queryKey: queryKeys.settings.get(),
    queryFn: settingsApi.getSettings,
  });

  // Always work with sanitized settings (no `id`, `updatedAt`)
  const settings = rawSettings ? sanitizeSettings(rawSettings) : undefined;

  const methods = useForm<SystemSettings>({
    defaultValues: settings
  });

  const { reset, formState: { isDirty }, handleSubmit } = methods;

  // Reset form when settings are loaded or updated from remote
  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSettings, reset]);

  const mutation = useMutation({
    mutationFn: (data: SystemSettings) => settingsApi.putSettings(data),
    onSuccess: (updatedData) => {
      toast.success('Configuraciones guardadas');
      const clean = sanitizeSettings(updatedData);
      qc.setQueryData(queryKeys.settings.get(), updatedData);
      reset(clean); // Reset to clear isDirty state
    },
    onError: () => {
      toast.error('Error al guardar configuraciones');
    }
  });

  const onSubmit = (data: SystemSettings) => {
    // Ensure we only send the 7 valid sections
    mutation.mutate(sanitizeSettings(data));
  };

  if (isLoading) {
    return <PageContainer title="Configuración del Sistema"><p>Cargando...</p></PageContainer>;
  }

  return (
    <ActionGuard action="manage" subject="Settings">
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <PageContainer
            title="Configuración del Sistema"
            subtitle="Ajustes globales que afectan el comportamiento de todo el ERP."
          >
            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'flex-start', paddingBottom: '80px' }}>

              {/* Sidebar nav */}
              <div style={{ position: 'sticky', top: '24px', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-base)' }}>
                {TABS.map((tab, i) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', border: 'none', background: activeTab === tab.id ? 'var(--blue-bg)' : 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                      borderBottom: i < TABS.length - 1 ? '1px solid var(--border)' : 'none',
                      borderLeft: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)' }}>{tab.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-primary)' }}>{tab.label}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{tab.description}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </button>
                ))}
              </div>

              {/* Panel content */}
              <div>
                <div style={{ display: activeTab === 'general' ? 'block' : 'none' }}><GeneralSettingsPanel /></div>
                <div style={{ display: activeTab === 'pricing' ? 'block' : 'none' }}><PricingSettingsPanel /></div>
                <div style={{ display: activeTab === 'skuBarcode' ? 'block' : 'none' }}><SkuBarcodeSettingsPanel /></div>
                <div style={{ display: activeTab === 'invoicing' ? 'block' : 'none' }}><InvoicingSettingsPanel /></div>
                <div style={{ display: activeTab === 'notifications' ? 'block' : 'none' }}><NotificationSettingsPanel /></div>
                <div style={{ display: activeTab === 'integrations' ? 'block' : 'none' }}><IntegrationSettingsPanel /></div>
                <div style={{ display: activeTab === 'offline' ? 'block' : 'none' }}><OfflineSettingsPanel /></div>
              </div>

            </div>
          </PageContainer>

          {/* Floating Save Bar */}
          {isDirty && (
            <div style={{
              position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px',
              padding: '16px 24px', boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: '24px',
              zIndex: 1000, animation: 'slideUp 0.3s ease'
            }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '14px' }}>Tienes cambios sin guardar</p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="outline" type="button" onClick={() => reset(settings)}>Descartar</Button>
                <Button variant="primary" type="submit" icon={<Save size={16} />} loading={mutation.isPending}>Guardar Cambios</Button>
              </div>
            </div>
          )}
        </form>
      </FormProvider>
    </ActionGuard>
  );
}
