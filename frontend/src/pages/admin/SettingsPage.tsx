import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, FileText, Bell, Plug, ChevronRight,
  Settings as SettingsIcon, ShoppingCart, QrCode, Smartphone, Tag, Receipt,
} from 'lucide-react';

import { PageContainer } from '@/components/ui';
import { ActionGuard } from '@/rbac/ActionGuard';
import { settingsApi } from '@/api/settings.api';
import { queryKeys } from '@/api/queryKeys';

import { GeneralSettingsPanel } from '@/features/settings/components/GeneralSettingsPanel';
import { SalesOptionsPanel } from '@/features/settings/components/SalesOptionsPanel';
import { ReceiptStylePanel } from '@/features/settings/components/ReceiptStylePanel';
import { InvoicingSettingsPanel, LabelPrintingSettingsPanel } from '@/features/settings/components/OtherSettingsPanels';
import { StorefrontSettingsPanel } from '@/features/settings/components/StorefrontSettingsPanel';
import { QrSettingsPanel } from '@/features/settings/components/QrSettingsPanel';
import { ArcaSettingsPanel } from '@/features/settings/components/ArcaSettingsPanel';
import { NotificationSettingsPanel, IntegrationSettingsPanel } from '@/features/settings/components/CommsSettingsPanels';
import { PwaSettingsPanel } from '@/features/settings/components/PwaSettingsPanel';

type SettingsTab =
  | 'general'
  | 'pos'
  | 'receipt'
  | 'fiscal'
  | 'labels'
  | 'storefront'
  | 'qr'
  | 'arca'
  | 'notifications'
  | 'integrations'
  | 'mobile';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'general',       label: 'Datos del comercio',     icon: <Building2 size={16} />, description: '' },
  { id: 'pos',           label: 'Opciones de venta',      icon: <SettingsIcon size={16} />, description: '' },
  { id: 'receipt',       label: 'Comprobante de venta',   icon: <Receipt size={16} />, description: '' },
  { id: 'fiscal',        label: 'Configuración fiscal',   icon: <FileText size={16} />, description: '' },
  { id: 'labels',        label: 'Etiquetas',              icon: <Tag size={16} />, description: '' },
  { id: 'storefront',    label: 'Tienda Web',             icon: <ShoppingCart size={16} />, description: '' },
  { id: 'qr',            label: 'QR de cobro',            icon: <QrCode size={16} />, description: '' },
  { id: 'arca',          label: 'ARCA / Facturación',     icon: <FileText size={16} />, description: '' },
  { id: 'notifications', label: 'Notificaciones',         icon: <Bell size={16} />, description: '' },
  { id: 'integrations',  label: 'Integraciones (Apps)',   icon: <Plug size={16} />, description: '' },
  { id: 'mobile',        label: 'App móvil / PWA',        icon: <Smartphone size={16} />, description: '' },
];

import styles from './SettingsPage.module.css';
import clsx from 'clsx';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const { isLoading } = useQuery({
    queryKey: queryKeys.settings.get(),
    queryFn: settingsApi.getSettings,
  });

  if (isLoading) {
    return (
      <PageContainer title="Configuración del Sistema">
        <p style={{ color: 'var(--text-muted)' }}>Cargando configuraciones...</p>
      </PageContainer>
    );
  }

  return (
    <ActionGuard action="manage" subject="Settings">
      <PageContainer
        title="Configuración del Sistema"
        subtitle="Ajustes globales que afectan el comportamiento de todo el ERP."
      >
        <div className={styles.layoutGrid}>
          {/* Sidebar nav */}
          <div className={styles.sidebarNav}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={clsx(styles.navButton, {
                  [styles.navButtonActive]: activeTab === tab.id,
                })}
              >
                <div className={styles.navIconWrapper}>
                  <span className={styles.navIcon}>{tab.icon}</span>
                  <div className={styles.navText}>
                    <p className={styles.navLabel}>{tab.label}</p>
                    {tab.description && <p className={styles.navDescription}>{tab.description}</p>}
                  </div>
                </div>
                <ChevronRight size={14} className={styles.navChevron} />
              </button>
            ))}
          </div>

          {/* Panel content (Autonomous Forms) */}
          <div className={styles.contentArea}>
            {activeTab === 'general' && <GeneralSettingsPanel />}
            {activeTab === 'pos' && <SalesOptionsPanel />}
            {activeTab === 'receipt' && <ReceiptStylePanel />}
            {activeTab === 'fiscal' && <InvoicingSettingsPanel />}
            {activeTab === 'labels' && <LabelPrintingSettingsPanel />}
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
