import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Res,
  Header,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { PermissionsGuard } from '../../../core/rbac/guards/permissions.guard';
import { RequirePermissions } from '../../../core/rbac/decorators/require-permissions.decorator';
import { LabelsRenderService } from './labels-render.service';
import { LabelTemplatesService } from './label-templates.service';
import { LabelsZplService } from './labels-zpl.service';
import { BulkPrintLabelsDto, PrintLabelsDto } from './dto/label-template.dto';
import { LabelLayout } from './label-layout.types';
import { SettingsService } from '../../../modules/settings/settings.service';

@Controller('labels')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class LabelsController {
  constructor(
    private readonly renderService: LabelsRenderService,
    private readonly templatesService: LabelTemplatesService,
    private readonly zplService: LabelsZplService,
    private readonly settingsService: SettingsService,
  ) {}

  private async resolveTemplate(templateId?: string) {
    return templateId
      ? this.templatesService.findOne(templateId)
      : this.templatesService.findDefault();
  }

  private async getLabelPrintingSettings() {
    return this.settingsService.getLabelPrintingSettings();
  }

  @Post('print/variant/:variantId')
  @RequirePermissions({ action: 'print', subject: 'Labels' })
  @Header('Content-Type', 'application/pdf')
  async printVariant(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: PrintLabelsDto,
    @Res() res: Response,
  ) {
    const template = await this.resolveTemplate(dto.templateId);
    const layout = template.layout as unknown as LabelLayout;
    const labelSettings = await this.getLabelPrintingSettings();
    const data = await this.renderService.prepareVariantForPrint(
      variantId,
      layout,
      labelSettings.autoGenerateBarcodeOnPrint,
    );

    const pdf = await this.renderService.generatePdf(
      [{ data, quantity: dto.quantity }],
      template.id,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="labels_${data.sku}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.send(pdf);
  }

  @Post('print')
  @RequirePermissions({ action: 'print', subject: 'Labels' })
  @Header('Content-Type', 'application/pdf')
  async printBulk(@Body() dto: BulkPrintLabelsDto, @Res() res: Response) {
    const template = await this.resolveTemplate(dto.templateId);
    const layout = template.layout as unknown as LabelLayout;
    const labelSettings = await this.getLabelPrintingSettings();
    const items = [];

    for (const item of dto.items) {
      const data = await this.renderService.prepareVariantForPrint(
        item.variantId,
        layout,
        labelSettings.autoGenerateBarcodeOnPrint,
      );
      items.push({ data, quantity: item.quantity });
    }

    const pdf = await this.renderService.generatePdf(items, template.id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="labels.pdf"',
      'Content-Length': pdf.length,
    });
    res.send(pdf);
  }

  @Post('export/zpl')
  @RequirePermissions({ action: 'print', subject: 'Labels' })
  async exportZpl(@Body() dto: BulkPrintLabelsDto, @Res() res: Response) {
    const template = await this.resolveTemplate(dto.templateId);
    const layout = template.layout as unknown as LabelLayout;
    const labelSettings = await this.getLabelPrintingSettings();
    const items = [];

    for (const item of dto.items) {
      const data = await this.renderService.prepareVariantForPrint(
        item.variantId,
        layout,
        labelSettings.autoGenerateBarcodeOnPrint,
      );
      items.push({ data, quantity: item.quantity });
    }

    const zpl = this.zplService.generateZpl(
      items,
      layout,
      template.labelWidth,
      template.labelHeight,
      labelSettings.zplDpi ?? 203,
    );

    const buffer = Buffer.from(zpl, 'utf-8');
    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="labels.zpl"',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
