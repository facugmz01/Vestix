import { useState } from 'react';
import {
  Building2, Tag, Barcode, FileText, Bell, Plug, WifiOff, ChevronRight
} from 'lucide-react';

import { 
  PageContainer
} from '@/components/ui';
import { ActionGuard } from '@/rbac/ActionGuard';
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
  | 'sku-barcode'
  | 'invoicing'
  | 'notifications'
  | 'integrations'
  | 'offline';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'general',       label: 'Empresa',          icon: <Building2 size={16} />, description: 'Datos fiscales y logo' },
  { id: 'pricing',       label: 'Precios',           icon: <Tag size={16} />,       description: 'IVA, descuentos, redondeo' },
  { id: 'sku-barcode',   label: 'SKU / Barcode',     icon: <Barcode size={16} />,   description: 'Generación automática' },
  { id: 'invoicing',     label: 'Facturación AFIP',  icon: <FileText size={16} />,  description: 'Punto de venta, ambiente' },
  { id: 'notifications', label: 'Notificaciones',    icon: <Bell size={16} />,      description: 'Canales y eventos' },
  { id: 'integrations',  label: 'Integraciones',     icon: <Plug size={16} />,      description: 'Activar/desactivar conectores' },
  { id: 'offline',       label: 'Modo Offline',      icon: <WifiOff size={16} />,   description: 'Estrategia y cola' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  return (
    <ActionGuard action="manage" subject="Settings">
      <PageContainer
        title="Configuración del Sistema"
        subtitle="Ajustes globales que afectan el comportamiento de todo el ERP."
      >
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'flex-start' }}>

          {/* Sidebar nav */}
          <div style={{ position: 'sticky', top: '24px', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-base)' }}>
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
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
            {activeTab === 'general'       && <GeneralSettingsPanel />}
            {activeTab === 'pricing'       && <PricingSettingsPanel />}
            {activeTab === 'sku-barcode'   && <SkuBarcodeSettingsPanel />}
            {activeTab === 'invoicing'     && <InvoicingSettingsPanel />}
            {activeTab === 'notifications' && <NotificationSettingsPanel />}
            {activeTab === 'integrations'  && <IntegrationSettingsPanel />}
            {activeTab === 'offline'       && <OfflineSettingsPanel />}
          </div>

        </div>
      </PageContainer>
    </ActionGuard>
  );
}
