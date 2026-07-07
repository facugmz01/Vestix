import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { IdentifiersService } from '../identifiers.service';
import { PricingService } from '../pricing.service';
import { LabelTemplatesService } from './label-templates.service';
import {
  LabelLayout,
  LabelPrintData,
  BarcodeSymbology,
} from './label-layout.types';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bwipjs = require('bwip-js');
import * as QRCode from 'qrcode';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

const MM_TO_PT = 72 / 25.4;

interface GeneralSettings {
  companyName?: string;
  logoUrl?: string;
}

@Injectable()
export class LabelsRenderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identifiersService: IdentifiersService,
    private readonly templatesService: LabelTemplatesService,
    private readonly pricingService: PricingService,
  ) {}

  private async getGeneralSettings(): Promise<GeneralSettings> {
    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });
    return (settings?.general ?? {}) as GeneralSettings;
  }

  async resolveVariantData(variantId: string, layout?: LabelLayout): Promise<LabelPrintData> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          include: { brand: true, category: true },
        },
        barcodes: true,
      },
    });

    if (!variant) throw new NotFoundException('Variante no encontrada');

    const general = await this.getGeneralSettings();
    const storeName = general.companyName || 'Vestix ERP';
    const barcode = await this.resolveBarcodeValue(variant, layout);

    let price = variant.basePrice;
    if (layout?.priceSource === 'PRICE_LIST' && layout.priceListId) {
      price = await this.pricingService.resolvePriceListPrice(
        variantId,
        variant.basePrice,
        layout.priceListId,
      );
    }

    return {
      storeName,
      productName: variant.product.name,
      sku: variant.sku,
      barcode,
      size: variant.size ?? undefined,
      color: variant.color ?? undefined,
      price,
      brand: variant.product.brand?.name,
      category: variant.product.category?.name,
      logoUrl: general.logoUrl,
    };
  }

  async ensureBarcode(variantId: string): Promise<string> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException('Variante no encontrada');
    if (variant.barcode) return variant.barcode;

    const barcode = await this.identifiersService.generateUniqueBarcode();
    await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { barcode },
    });
    return barcode;
  }

  async resolveBarcodeValue(
    variant: {
      sku: string;
      barcode: string | null;
      barcodes: { barcode: string; type: string }[];
    },
    layout?: LabelLayout,
  ): Promise<string> {
    const source = layout?.barcodeSource ?? 'PRIMARY';
    if (source === 'SKU') return variant.sku;
    if (source === 'SECONDARY') {
      const alt =
        variant.barcodes.find((b) => b.type === 'MANUFACTURER') ?? variant.barcodes[0];
      if (alt) return alt.barcode;
    }
    return variant.barcode || variant.sku;
  }

  async prepareVariantForPrint(
    variantId: string,
    layout?: LabelLayout,
    autoGenerate = true,
  ): Promise<LabelPrintData> {
    const data = await this.resolveVariantData(variantId, layout);

    if (
      autoGenerate &&
      (layout?.barcodeSource ?? 'PRIMARY') === 'PRIMARY' &&
      (!data.barcode || data.barcode === data.sku)
    ) {
      const variant = await this.prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant?.barcode) {
        data.barcode = await this.ensureBarcode(variantId);
      }
    }

    return data;
  }

  resolveFieldValue(
    field: string | undefined,
    data: LabelPrintData,
    element?: { customText?: string },
  ): string {
    if (field === 'custom') return element?.customText || '';
    switch (field) {
      case 'storeName':
        return data.storeName;
      case 'productName':
        return data.productName;
      case 'sku':
        return data.sku;
      case 'barcode':
        return data.barcode;
      case 'size':
        return data.size || '';
      case 'color':
        return data.color || '';
      case 'sizeColor':
        return [data.size, data.color].filter(Boolean).join(' - ');
      case 'price':
        return `$${data.price.toLocaleString('es-AR')}`;
      case 'brand':
        return data.brand || '';
      case 'category':
        return data.category || '';
      default:
        return '';
    }
  }

  pickBarcodeFormat(symbology: BarcodeSymbology, value: string): BarcodeSymbology {
    if (symbology === 'NONE') return 'NONE';
    if (symbology === 'QR') return 'QR';
    if (symbology === 'EAN13' && /^\d{13}$/.test(value)) return 'EAN13';
    return 'CODE128';
  }

  async renderBarcodePng(
    value: string,
    symbology: BarcodeSymbology,
    widthMm: number,
    heightMm: number,
  ): Promise<Buffer | null> {
    if (symbology === 'NONE' || !value) return null;

    const format = this.pickBarcodeFormat(symbology, value);
    const widthPx = Math.round(widthMm * 8);
    const heightPx = Math.round(heightMm * 8);

    if (format === 'QR') {
      return QRCode.toBuffer(value, {
        width: Math.min(widthPx, heightPx),
        margin: 0,
        errorCorrectionLevel: 'M',
      });
    }

    const bcid = format === 'EAN13' ? 'ean13' : 'code128';
    return bwipjs.toBuffer({
      bcid,
      text: value,
      scale: 2,
      height: Math.max(6, Math.round(heightMm * 2)),
      includetext: true,
      textxalign: 'center',
      width: widthPx,
    });
  }

  async generatePdf(
    items: { data: LabelPrintData; quantity: number }[],
    templateId?: string,
  ): Promise<Buffer> {
    const template = templateId
      ? await this.templatesService.findOne(templateId)
      : await this.templatesService.findDefault();

    const layout = template.layout as unknown as LabelLayout;
    const labelW = template.labelWidth * MM_TO_PT;
    const labelH = template.labelHeight * MM_TO_PT;

    const labels: LabelPrintData[] = [];
    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        labels.push(item.data);
      }
    }

    const doc = new PDFDocument({ autoFirstPage: false, margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const pageWidth = template.paperType === 'SHEET' && template.paperWidth
      ? template.paperWidth * MM_TO_PT
      : labelW;
    const pageHeight = template.paperType === 'SHEET' && template.paperHeight
      ? template.paperHeight * MM_TO_PT
      : labelH;

    const cols = template.colsPerRow || 1;
    const marginLeft = (template.marginLeft || 0) * MM_TO_PT;
    const marginTop = (template.marginTop || 0) * MM_TO_PT;
    const colGap = (template.colGap || 0) * MM_TO_PT;
    const rowGap = (template.rowGap || 0) * MM_TO_PT;

    let labelIndexOnPage = 0;
    const labelsPerPage = template.paperType === 'SHEET'
      ? template.labelsPerSheet || cols * 10
      : 1;

    for (const data of labels) {
      if (labelIndexOnPage % labelsPerPage === 0) {
        doc.addPage({ size: [pageWidth, pageHeight], margin: 0 });
        labelIndexOnPage = 0;
      }

      const col = labelIndexOnPage % cols;
      const row = Math.floor(labelIndexOnPage / cols);
      const x = marginLeft + col * (labelW + colGap);
      const y = marginTop + row * (labelH + rowGap);

      await this.drawLabel(doc, data, layout, x, y, labelW, labelH, template.labelWidth, template.labelHeight);
      labelIndexOnPage++;
    }

    if (labels.length === 0) {
      doc.addPage({ size: [labelW, labelH], margin: 0 });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  private async drawLabel(
    doc: typeof PDFDocument,
    data: LabelPrintData,
    layout: LabelLayout,
    originX: number,
    originY: number,
    labelW: number,
    labelH: number,
    labelWidthMm: number,
    labelHeightMm: number,
  ) {
    doc.save();
    doc.rect(originX, originY, labelW, labelH).stroke('#cccccc');

    for (const element of layout.elements) {
      if (!element.visible) continue;

      const x = originX + element.x * MM_TO_PT;
      const y = originY + element.y * MM_TO_PT;
      const w = (element.width ?? labelWidthMm - element.x * 2) * MM_TO_PT;
      const h = (element.height ?? 8) * MM_TO_PT;

      if (element.type === 'TEXT') {
        const text = this.resolveFieldValue(element.field, data, element);
        if (!text) continue;
        doc
          .font(element.fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(element.fontSize ?? 8)
          .text(text, x, y, {
            width: w,
            align: element.textAlign ?? 'left',
            lineBreak: false,
          });
      } else if (element.type === 'IMAGE' && element.field === 'logo' && data.logoUrl) {
        try {
          doc.image(data.logoUrl, x, y, { width: w, height: h, fit: [w, h] });
        } catch {
          // Skip if logo cannot be loaded
        }
      } else if (element.type === 'BARCODE' || element.type === 'QR') {
        const value = data.barcode || data.sku;
        const symbology = element.type === 'QR' ? 'QR' : layout.barcodeSymbology;
        const png = await this.renderBarcodePng(value, symbology, element.width ?? labelWidthMm - 4, element.height ?? 8);
        if (png) {
          doc.image(png, x, y, { width: w, height: h, fit: [w, h] });
        }
      }
    }

    doc.restore();
  }
}
