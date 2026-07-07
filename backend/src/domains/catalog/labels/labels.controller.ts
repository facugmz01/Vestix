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
import { BulkPrintLabelsDto, PrintLabelsDto } from './dto/label-template.dto';

@Controller('labels')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class LabelsController {
  constructor(private readonly renderService: LabelsRenderService) {}

  @Post('print/variant/:variantId')
  @RequirePermissions({ action: 'print', subject: 'Labels' })
  @Header('Content-Type', 'application/pdf')
  async printVariant(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: PrintLabelsDto,
    @Res() res: Response,
  ) {
    const data = await this.renderService.resolveVariantData(variantId);

    if (!data.barcode || data.barcode === data.sku) {
      const barcode = await this.renderService.ensureBarcode(variantId);
      data.barcode = barcode;
    }

    const pdf = await this.renderService.generatePdf(
      [{ data, quantity: dto.quantity }],
      dto.templateId,
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
    const items = [];

    for (const item of dto.items) {
      const data = await this.renderService.resolveVariantData(item.variantId);
      if (!data.barcode || data.barcode === data.sku) {
        const barcode = await this.renderService.ensureBarcode(item.variantId);
        data.barcode = barcode;
      }
      items.push({ data, quantity: item.quantity });
    }

    const pdf = await this.renderService.generatePdf(items, dto.templateId);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="labels.pdf"',
      'Content-Length': pdf.length,
    });
    res.send(pdf);
  }
}
