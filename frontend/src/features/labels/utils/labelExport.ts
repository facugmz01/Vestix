import type { LabelTemplate, LabelTemplateExport, CreateLabelTemplateDto } from '../types/label.types';

export function exportTemplateToJson(template: LabelTemplate): void {
  const payload: LabelTemplateExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    template: {
      name: template.name,
      description: template.description ?? undefined,
      labelWidth: template.labelWidth,
      labelHeight: template.labelHeight,
      paperType: template.paperType,
      paperWidth: template.paperWidth ?? undefined,
      paperHeight: template.paperHeight ?? undefined,
      marginTop: template.marginTop,
      marginLeft: template.marginLeft,
      rowGap: template.rowGap,
      colGap: template.colGap,
      colsPerRow: template.colsPerRow,
      labelsPerSheet: template.labelsPerSheet ?? undefined,
      layout: template.layout,
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `plantilla_${template.name.replace(/\s+/g, '_').toLowerCase()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function parseImportedTemplate(json: unknown): CreateLabelTemplateDto {
  const data = json as LabelTemplateExport;
  if (!data || data.version !== 1 || !data.template) {
    throw new Error('Formato de plantilla inválido');
  }
  const t = data.template;
  if (!t.name || !t.labelWidth || !t.labelHeight || !t.layout) {
    throw new Error('La plantilla importada está incompleta');
  }
  return {
    ...t,
    name: `${t.name} (importada)`,
  };
}
