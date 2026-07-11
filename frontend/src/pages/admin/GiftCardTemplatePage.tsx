import { PageContainer, Tabs } from '@/components/ui';
import { ActionGuard } from '@/rbac/ActionGuard';
import { CRM_TABS } from '@/navigation/moduleTabs';
import { GiftCardTemplatePanel } from '@/features/settings/components/GiftCardTemplatePanel';

export default function GiftCardTemplatePage() {
  return (
    <ActionGuard action="manage" subject="Sales">
      <PageContainer
        title="Plantilla de Gift Cards"
        subtitle="Personalizá el diseño de las tarjetas digitales e impresas."
        tabs={<Tabs items={CRM_TABS} />}
      >
        <GiftCardTemplatePanel />
      </PageContainer>
    </ActionGuard>
  );
}
