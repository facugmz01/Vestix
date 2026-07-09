import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, FileText, Bell, Plug, ChevronRight,
  Settings as SettingsIcon, ShoppingCart, QrCode, Smartphone, Tag, Receipt,
} from 'lucide-react';
import clsx from 'clsx';

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

import styles from './SettingsPage.module.css';

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

const TAB_META: Record<SettingsTab, { label: string; icon: React.ReactNode; description: string }> = {
  general:       { label: 'Datos del comercio',   icon: <Building2 size={16} />,    description: 'Nombre, logo y datos fiscales básicos' },
  pos:           { label: 'Opciones de venta',    icon: <SettingsIcon size={16} />,   description: 'Comportamiento del punto de venta' },
  receipt:       { label: 'Comprobante de venta', icon: <Receipt size={16} />,        description: 'Formato y estilo del ticket' },
  fiscal:        { label: 'Configuración fiscal', icon: <FileText size={16} />,       description: 'Impuestos y facturación' },
  labels:        { label: 'Etiquetas',            icon: <Tag size={16} />,            description: 'Impresión de etiquetas de producto' },
  storefront:    { label: 'Tienda Web',           icon: <ShoppingCart size={16} />,   description: 'Apariencia y opciones de la tienda' },
  qr:            { label: 'QR de cobro',          icon: <QrCode size={16} />,         description: 'Pagos con código QR' },
  arca:          { label: 'ARCA / Facturación',   icon: <FileText size={16} />,       description: 'Integración con ARCA/AFIP' },
  notifications: { label: 'Notificaciones',     icon: <Bell size={16} />,           description: 'Emails, SMS y plantillas' },
  integrations:  { label: 'Integraciones',      icon: <Plug size={16} />,           description: 'Apps y servicios externos' },
  mobile:        { label: 'App móvil / PWA',      icon: <Smartphone size={16} />,     description: 'Instalación y comportamiento PWA' },
};

const TAB_GROUPS: { label: string; tabs: SettingsTab[] }[] = [
  { label: 'Comercio', tabs: ['general', 'pos', 'receipt'] },
  { label: 'Operación', tabs: ['fiscal', 'labels', 'arca'] },
  { label: 'Canales', tabs: ['storefront', 'qr', 'mobile'] },
  { label: 'Sistema', tabs: ['notifications', 'integrations'] },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  const { isLoading } = useQuery({
    queryKey: queryKeys.settings.get(),
    queryFn: settingsApi.getSettings,
  });

  if (isLoading) {
    return (
      <PageContainer title="Configuración del Sistema">
        <p className={styles.loading}>Cargando configuraciones...</p>
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
          <nav className={styles.sidebarNav} aria-label="Secciones de configuración">
            {TAB_GROUPS.map((group) => (
              <div key={group.label} className={styles.navGroup}>
                <p className={styles.groupLabel}>{group.label}</p>
                {group.tabs.map((tabId) => {
                  const tab = TAB_META[tabId];
                  return (
                    <button
                      key={tabId}
                      type="button"
                      onClick={() => setActiveTab(tabId)}
                      className={clsx(styles.navButton, activeTab === tabId && styles.navButtonActive)}
                    >
                      <div className={styles.navIconWrapper}>
                        <span className={styles.navIcon}>{tab.icon}</span>
                        <div className={styles.navText}>
                          <p className={styles.navLabel}>{tab.label}</p>
                          <p className={styles.navDescription}>{tab.description}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className={styles.navChevron} />
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

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
