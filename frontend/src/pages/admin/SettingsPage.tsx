import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Building2, Tag, Barcode, FileText, Bell, Plug, WifiOff, ChevronRight, Save,
  Settings as SettingsIcon, Image as ImageIcon, Star, ShoppingCart, QrCode, LayoutList, Shield, Smartphone, Megaphone
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
// We will create these shortly:
import { SalesOptionsPanel } from '@/features/settings/components/SalesOptionsPanel';
import { StorefrontSettingsPanel } from '@/features/settings/components/StorefrontSettingsPanel';
import { ArcaSettingsPanel } from '@/features/settings/components/ArcaSettingsPanel';
import { PwaSettingsPanel } from '@/features/settings/components/PwaSettingsPanel';
import { QrSettingsPanel } from '@/features/settings/components/QrSettingsPanel';

type SettingsTab =
  | 'general'
  | 'pos'
  | 'fiscal'
  | 'storefront'
  | 'qr'
  | 'arca'
  | 'menu'
  | 'privacy'
  | 'mobile'
  | 'ads';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'general',       label: 'Datos del comercio',     icon: <Building2 size={16} />, description: '' },
  { id: 'pos',           label: 'Opciones de venta',      icon: <SettingsIcon size={16} />, description: '' },
  { id: 'fiscal',        label: 'Configuración fiscal',   icon: <FileText size={16} />, description: '' },
  { id: 'storefront',    label: 'Tienda Web',             icon: <ShoppingCart size={16} />, description: '' },
  { id: 'qr',            label: 'QR de cobro',            icon: <QrCode size={16} />, description: '' },
  { id: 'arca',          label: 'ARCA / Facturación',     icon: <FileText size={16} />, description: '' },
  { id: 'menu',          label: 'Menú visible',           icon: <LayoutList size={16} />, description: '' },
  { id: 'privacy',       label: 'Privacidad y seguridad', icon: <Shield size={16} />, description: '' },
  { id: 'mobile',        label: 'App móvil / PWA',        icon: <Smartphone size={16} />, description: '' },
  { id: 'ads',           label: 'Publicidad / Reseña',    icon: <Megaphone size={16} />, description: '' },
];

/**
 * Extracts only the valid settings sections from a raw API response
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
    pos:           raw?.pos           ?? {},
    arca:          raw?.arca          ?? {},
    storefront:    raw?.storefront    ?? {},
    mobile:        raw?.mobile        ?? {},
    qr:            raw?.qr            ?? {},
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
            <div className="grid-responsive grid-cols-settings" style={{ alignItems: "flex-start", gap: "24px", paddingBottom: "80px" }}>

              {/* Sidebar nav */}
              <div className="settings-sidebar" style={{ position: 'sticky', top: '24px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-base)' }}>
                {TABS.map((tab, i) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', border: 'none', background: activeTab === tab.id ? 'var(--blue-bg)' : 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                      borderBottom: '1px solid var(--border)',
                      borderLeft: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
                      transition: 'background 0.15s',
                      minWidth: '200px', // Ensures tabs don't squish too much on mobile
                      flexShrink: 0,
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
                <div style={{ display: activeTab === 'pos' ? 'block' : 'none' }}><SalesOptionsPanel /></div>
                <div style={{ display: activeTab === 'fiscal' ? 'block' : 'none' }}><InvoicingSettingsPanel /></div>
                <div style={{ display: activeTab === 'storefront' ? 'block' : 'none' }}><StorefrontSettingsPanel /></div>
                <div style={{ display: activeTab === 'qr' ? 'block' : 'none' }}><QrSettingsPanel /></div>
                <div style={{ display: activeTab === 'arca' ? 'block' : 'none' }}><ArcaSettingsPanel /></div>
                <div style={{ display: activeTab === 'menu' ? 'block' : 'none' }}>
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Módulo de Menú Visible en construcción</div>
                </div>
                <div style={{ display: activeTab === 'privacy' ? 'block' : 'none' }}>
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Módulo de Privacidad y Seguridad en construcción</div>
                </div>
                <div style={{ display: activeTab === 'mobile' ? 'block' : 'none' }}><PwaSettingsPanel /></div>
                <div style={{ display: activeTab === 'ads' ? 'block' : 'none' }}>
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Módulo de Publicidad y Reseña en construcción</div>
                </div>
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
