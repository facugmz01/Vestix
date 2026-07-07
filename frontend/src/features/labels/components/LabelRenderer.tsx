import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { QRCodeSVG } from 'qrcode.react';
import type { LabelLayout, LabelPrintData, BarcodeSymbology, LabelElement } from '../types/label.types';
import styles from './LabelRenderer.module.css';

interface Props {
  data: LabelPrintData;
  layout: LabelLayout;
  widthMm: number;
  heightMm: number;
  className?: string;
}

function resolveField(field: string | undefined, data: LabelPrintData, element?: LabelElement): string {
  if (field === 'custom') return element?.customText || '';
  switch (field) {
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

function pickFormat(symbology: BarcodeSymbology, value: string): BarcodeSymbology {
  if (symbology === 'NONE') return 'NONE';
  if (symbology === 'QR') return 'QR';
  if (symbology === 'EAN13' && /^\d{13}$/.test(value)) return 'EAN13';
  return 'CODE128';
}

function BarcodeElement({
  value,
  symbology,
  widthMm,
  heightMm,
}: {
  value: string;
  symbology: BarcodeSymbology;
  widthMm: number;
  heightMm: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const format = pickFormat(symbology, value);

  useEffect(() => {
    if (!svgRef.current || format === 'QR' || format === 'NONE' || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: format === 'EAN13' ? 'EAN13' : 'CODE128',
        width: 1.2,
        height: Math.max(20, heightMm * 2),
        displayValue: true,
        fontSize: 10,
        margin: 0,
      });
    } catch {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        width: 1.2,
        height: Math.max(20, heightMm * 2),
        displayValue: true,
        fontSize: 10,
        margin: 0,
      });
    }
  }, [value, format, heightMm]);

  if (!value || format === 'NONE') return null;

  if (format === 'QR') {
    const size = Math.min(widthMm * 3.78, heightMm * 3.78);
    return (
      <div className={styles.qrWrap}>
        <QRCodeSVG value={value} size={size} level="M" />
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      className={styles.barcodeSvg}
      style={{ maxWidth: `${widthMm}mm`, maxHeight: `${heightMm}mm` }}
    />
  );
}

export function LabelRenderer({ data, layout, widthMm, heightMm, className }: Props) {
  return (
    <div
      className={`${styles.label} ${className ?? ''}`}
      style={{ width: `${widthMm}mm`, height: `${heightMm}mm` }}
    >
      {layout.elements.filter((el) => el.visible).map((element) => {
        const elementWidth = element.width ?? widthMm - element.x * 2;
        const elementHeight = element.height ?? 8;
        const style = {
          left: `${element.x}mm`,
          top: `${element.y}mm`,
          width: element.width ? `${elementWidth}mm` : undefined,
          height: element.height ? `${elementHeight}mm` : undefined,
          fontSize: element.fontSize ? `${element.fontSize}pt` : undefined,
          fontWeight: element.fontWeight,
          textAlign: element.textAlign,
        } as React.CSSProperties;

        if (element.type === 'TEXT') {
          const text = resolveField(element.field, data, element);
          if (!text) return null;
          return (
            <div key={element.id} className={styles.textElement} style={style}>
              {text}
            </div>
          );
        }

        if (element.type === 'IMAGE' && element.field === 'logo' && data.logoUrl) {
          return (
            <div key={element.id} className={styles.imageElement} style={style}>
              <img src={data.logoUrl} alt="" className={styles.logoImg} />
            </div>
          );
        }

        if (element.type === 'BARCODE' || element.type === 'QR') {
          const value = data.barcode || data.sku;
          const symbology = element.type === 'QR' ? 'QR' : layout.barcodeSymbology;
          return (
            <div key={element.id} className={styles.barcodeElement} style={style}>
              <BarcodeElement
                value={value}
                symbology={symbology}
                widthMm={elementWidth}
                heightMm={elementHeight}
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
