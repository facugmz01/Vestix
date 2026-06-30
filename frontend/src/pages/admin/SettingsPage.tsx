import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, FileText, Bell, Plug, ChevronRight,
  Settings as SettingsIcon, ShoppingCart, QrCode, Smartphone
} from 'lucide-react';

import { PageContainer } from '@/components/ui';
import { ActionGuard } from '@/rbac/ActionGuard';
import { settingsApi } from '@/api/settings.api';
import { queryKeys } from '@/api/queryKeys';

import { GeneralSettingsPanel } from '@/features/settings/components/GeneralSettingsPanel';
import { SalesOptionsPanel } from '@/features/settings/components/SalesOptionsPanel';
import { InvoicingSettingsPanel } from '@/features/settings/components/OtherSettingsPanels';
import { StorefrontSettingsPanel } from '@/features/settings/components/StorefrontSettingsPanel';
import { QrSettingsPanel } from '@/features/settings/components/QrSettingsPanel';
import { ArcaSettingsPanel } from '@/features/settings/components/ArcaSettingsPanel';
import { NotificationSettingsPanel, IntegrationSettingsPanel } from '@/features/settings/components/CommsSettingsPanels';
import { PwaSettingsPanel } from '@/features/settings/components/PwaSettingsPanel';

type SettingsTab =
  | 'general'
  | 'pos'
  | 'fiscal'
  | 'storefront'
  | 'qr'
  | 'arca'
  | 'notifications'
  | 'integrations'
  | 'mobile';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'general',       label: 'Datos del comercio',     icon: <Building2 size={16} />, description: '' },
  { id: 'pos',           label: 'Opciones de venta',      icon: <SettingsIcon size={16} />, description: '' },
  { id: 'fiscal',        label: 'Configuración fiscal',   icon: <FileText size={16} />, description: '' },
  { id: 'storefront',    label: 'Tienda Web',             icon: <ShoppingCart size={16} />, description: '' },
  { id: 'qr',            label: 'QR de cobro',            icon: <QrCode size={16} />, description: '' },
  { id: 'arca',          label: 'ARCA / Facturación',     icon: <FileText size={16} />, description: '' },
  { id: 'notifications', label: 'Notificaciones',         icon: <Bell size={16} />, description: '' },
  { id: 'integrations',  label: 'Integraciones (Apps)',   icon: <Plug size={16} />, description: '' },
  { id: 'mobile',        label: 'App móvil / PWA',        icon: <Smartphone size={16} />, description: '' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const { isLoading } = useQuery({
    queryKey: queryKeys.settings.get(),
    queryFn: settingsApi.getSettings,
  });

  if (isLoading) {
    return <PageContainer title="Configuración del Sistema"><p style={{ color: 'var(--text-muted)' }}>Cargando configuraciones...</p></PageContainer>;
  }

  return (
    <ActionGuard action="manage" subject="Settings">
      <PageContainer
        title="Configuración del Sistema"
        subtitle="Ajustes globales que afectan el comportamiento de todo el ERP."
      >
        <div className="grid-responsive grid-cols-settings" style={{ alignItems: "flex-start", gap: "24px", paddingBottom: "80px" }}>

          {/* Sidebar nav */}
          <div className="settings-sidebar" style={{ position: 'sticky', top: '24px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-base)', overflow: 'hidden' }}>
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', border: 'none', background: activeTab === tab.id ? 'var(--blue-bg)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                  borderBottom: i === TABS.length - 1 ? 'none' : '1px solid var(--border)',
                  borderLeft: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'background 0.15s',
                  minWidth: '200px',
                  flexShrink: 0,
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)' }}>{tab.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-primary)' }}>{tab.label}</p>
                    {tab.description && <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{tab.description}</p>}
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </button>
            ))}
          </div>

          {/* Panel content (Autonomous Forms) */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {activeTab === 'general' && <GeneralSettingsPanel />}
            {activeTab === 'pos' && <SalesOptionsPanel />}
            {activeTab === 'fiscal' && <InvoicingSettingsPanel />}
            {activeTab === 'storefront' && <StorefrontSettingsPanel />}
            {activeTab === 'qr' && <QrSettingsPanel />}
            {activeTab === 'arca' && <ArcaSettingsPanel />}
            {activeTab === 'notifications' && <NotificationSettingsPanel />}
            {activeTab === 'integrations' && <IntegrationSettingsPanel />}
            {activeTab === 'mobile' && <PwaSettingsPanel />}
          </div>

        </div>
      </PageContainer>
    </ActionGuard>
  );
}
