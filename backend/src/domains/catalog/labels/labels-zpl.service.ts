import { Injectable } from '@nestjs/common';
import {
  LabelLayout,
  LabelPrintData,
  LabelElement,
  BarcodeSymbology,
} from './label-layout.types';

const DEFAULT_DPI = 203;

@Injectable()
export class LabelsZplService {
  private mmToDots(mm: number, dpi = DEFAULT_DPI): number {
    return Math.round(mm * (dpi / 25.4));
  }

  generateZpl(
    items: { data: LabelPrintData; quantity: number }[],
    layout: LabelLayout,
    labelWidthMm: number,
    labelHeightMm: number,
    dpi = DEFAULT_DPI,
  ): string {
    const chunks: string[] = [];

    for (const item of items) {
      for (let i = 0; i < item.quantity; i++) {
        chunks.push(this.renderLabelZpl(item.data, layout, labelWidthMm, labelHeightMm, dpi));
      }
    }

    return chunks.join('\n');
  }

  private renderLabelZpl(
    data: LabelPrintData,
    layout: LabelLayout,
    labelWidthMm: number,
    _labelHeightMm: number,
    dpi: number,
  ): string {
    const lines: string[] = ['^XA', '^CI28']; // UTF-8

    const pw = this.mmToDots(labelWidthMm, dpi);
    lines.push(`^PW${pw}`);

    for (const element of layout.elements) {
      if (!element.visible) continue;
      const x = this.mmToDots(element.x, dpi);
      const y = this.mmToDots(element.y, dpi);
      const w = this.mmToDots(element.width ?? labelWidthMm - element.x * 2, dpi);
      const h = this.mmToDots(element.height ?? 8, dpi);

      if (element.type === 'TEXT') {
        const text = this.resolveField(element, data);
        if (!text) continue;
        const fontH = this.mmToDots((element.fontSize ?? 8) * 0.35, dpi);
        const fontW = Math.max(10, Math.round(fontH * 0.8));
        const align = element.textAlign ?? 'left';
        let foX = x;
        if (align === 'center') foX = x + Math.round(w / 2);
        if (align === 'right') foX = x + w;
        const fb = align === 'center' ? '^FB' + w + ',1,0,C,0' : align === 'right' ? '^FB' + w + ',1,0,R,0' : '';
        lines.push(`^FO${foX},${y}${fb}^A0N,${fontH},${fontW}^FD${this.escapeZpl(text)}^FS`);
      } else if (element.type === 'BARCODE' || element.type === 'QR') {
        const value = data.barcode || data.sku;
        if (!value) continue;
        const symbology = element.type === 'QR' ? 'QR' : layout.barcodeSymbology;
        lines.push(...this.barcodeZpl(x, y, w, h, value, symbology));
      } else if (element.type === 'IMAGE' && element.field === 'logo' && data.logoUrl) {
        // Logo requires downloaded image — placeholder text in ZPL
        lines.push(`^FO${x},${y}^A0N,${Math.max(12, h)},${Math.max(10, w)}^FD[LOGO]^FS`);
      }
    }

    lines.push('^XZ');
    return lines.join('\n');
  }

  private barcodeZpl(
    x: number,
    y: number,
    w: number,
    h: number,
    value: string,
    symbology: BarcodeSymbology,
  ): string[] {
    if (symbology === 'NONE' || !value) return [];

    if (symbology === 'QR') {
      const mag = Math.max(2, Math.min(10, Math.round(Math.min(w, h) / 40)));
      return [`^FO${x},${y}^BQN,2,${mag}^FDQA,${this.escapeZpl(value)}^FS`];
    }

    const barH = Math.max(30, h);
    const module = Math.max(2, Math.min(4, Math.round(w / 80)));

    if (symbology === 'EAN13' && /^\d{13}$/.test(value)) {
      return [`^FO${x},${y}^BY${module}^BEN,${barH},Y,N,N^FD${value}^FS`];
    }

    return [`^FO${x},${y}^BY${module}^BCN,${barH},Y,N,N^FD${this.escapeZpl(value)}^FS`];
  }

  private resolveField(element: LabelElement, data: LabelPrintData): string {
    if (element.field === 'custom') return element.customText || '';
    switch (element.field) {
      case 'storeName': return data.storeName;
      case 'productName': return data.productName;
      case 'sku': return data.sku;
      case 'barcode': return data.barcode;
      case 'size': return data.size || '';
      case 'color': return data.color || '';
      case 'sizeColor': return [data.size, data.color].filter(Boolean).join(' - ');
      case 'price': return `$${data.price.toLocaleString('es-AR')}`;
      case 'brand': return data.brand || '';
      case 'category': return data.category || '';
      default: return '';
    }
  }

  private escapeZpl(text: string): string {
    return text.replace(/\^/g, '').replace(/~/g, '').replace(/\\/g, '');
  }
}
