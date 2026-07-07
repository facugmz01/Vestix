import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageContainer, PageSpinner, ApiErrorDisplay } from '@/components/ui';
import { CATALOG_TABS } from '@/navigation/moduleTabs';
import { Tabs } from '@/components/ui';
import { labelsApi } from '@/api/labels.api';
import { TemplateEditor } from '@/features/labels/components/TemplateEditor/TemplateEditor';

export default function LabelTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';

  const { data: template, isLoading, error, refetch } = useQuery({
    queryKey: ['labelTemplate', id],
    queryFn: () => labelsApi.getTemplate(id!),
    enabled: !isNew && !!id,
  });

  if (!isNew && isLoading) return <PageSpinner />;
  if (!isNew && error) return <ApiErrorDisplay error={error} onRetry={refetch} />;

  return (
    <PageContainer title={isNew ? 'Nueva plantilla' : 'Editor de plantilla'}>
      <Tabs items={CATALOG_TABS} />
      <TemplateEditor template={isNew ? null : template} />
    </PageContainer>
  );
}
