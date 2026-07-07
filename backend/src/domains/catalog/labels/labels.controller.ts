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
import { BulkPrintLabelsDto, PrintLabelsDto } from './dto/label-template.dto';
import { LabelLayout } from './label-layout.types';

@Controller('labels')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class LabelsController {
  constructor(
    private readonly renderService: LabelsRenderService,
    private readonly templatesService: LabelTemplatesService,
  ) {}

  private async resolveTemplate(templateId?: string) {
    return templateId
      ? this.templatesService.findOne(templateId)
      : this.templatesService.findDefault();
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
    const data = await this.renderService.resolveVariantData(variantId, layout);

    if (!data.barcode || data.barcode === data.sku) {
      const barcode = await this.renderService.ensureBarcode(variantId);
      data.barcode = barcode;
    }

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
    const items = [];

    for (const item of dto.items) {
      const data = await this.renderService.resolveVariantData(item.variantId, layout);
      if (!data.barcode || data.barcode === data.sku) {
        const barcode = await this.renderService.ensureBarcode(item.variantId);
        data.barcode = barcode;
      }
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
}
