export type BarcodeSymbology = 'EAN13' | 'CODE128' | 'QR' | 'NONE';
export type LabelElementType = 'TEXT' | 'BARCODE' | 'QR' | 'IMAGE' | 'LINE' | 'RECT';
export type LabelField =
  | 'storeName'
  | 'productName'
  | 'sku'
  | 'barcode'
  | 'size'
  | 'color'
  | 'sizeColor'
  | 'price'
  | 'brand'
  | 'category'
  | 'custom';

export interface LabelElement {
  id: string;
  type: LabelElementType;
  field?: LabelField;
  customText?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  visible: boolean;
}

export interface LabelLayout {
  version: 1;
  elements: LabelElement[];
  barcodeSymbology: BarcodeSymbology;
  barcodeSource: 'PRIMARY' | 'SKU';
  priceSource: 'BASE';
}

export interface LabelPrintData {
  storeName: string;
  productName: string;
  sku: string;
  barcode: string;
  size?: string;
  color?: string;
  price: number;
  brand?: string;
  category?: string;
}

export interface SimpleTemplateOptions {
  showStoreName?: boolean;
  showProductName?: boolean;
  showSizeColor?: boolean;
  showBarcode?: boolean;
  showPrice?: boolean;
  barcodeSymbology?: BarcodeSymbology;
}

export function buildLayoutFromOptions(
  labelWidth: number,
  labelHeight: number,
  options: SimpleTemplateOptions = {},
): LabelLayout {
  const {
    showStoreName = true,
    showProductName = true,
    showSizeColor = true,
    showBarcode = true,
    showPrice = true,
    barcodeSymbology = 'EAN13',
  } = options;

  const elements: LabelElement[] = [];
  let y = 1;

  if (showStoreName) {
    elements.push({
      id: 'store',
      type: 'TEXT',
      field: 'storeName',
      x: 1,
      y,
      width: labelWidth - 2,
      fontSize: 6,
      fontWeight: 'bold',
      textAlign: 'center',
      visible: true,
    });
    y += 3;
  }

  if (showProductName) {
    elements.push({
      id: 'product',
      type: 'TEXT',
      field: 'productName',
      x: 1,
      y,
      width: labelWidth - 2,
      fontSize: 8,
      fontWeight: 'bold',
      textAlign: 'center',
      visible: true,
    });
    y += 4;
  }

  if (showSizeColor) {
    elements.push({
      id: 'attrs',
      type: 'TEXT',
      field: 'sizeColor',
      x: 1,
      y,
      width: labelWidth - 2,
      fontSize: 6,
      textAlign: 'center',
      visible: true,
    });
    y += 3;
  }

  if (showBarcode) {
    const barcodeHeight = Math.min(10, labelHeight * 0.35);
    elements.push({
      id: 'barcode',
      type: 'BARCODE',
      field: 'barcode',
      x: 2,
      y,
      width: labelWidth - 4,
      height: barcodeHeight,
      visible: true,
    });
    y += barcodeHeight + 1;
  }

  if (showPrice) {
    elements.push({
      id: 'price',
      type: 'TEXT',
      field: 'price',
      x: 1,
      y: Math.min(y, labelHeight - 4),
      width: labelWidth - 2,
      fontSize: 9,
      fontWeight: 'bold',
      textAlign: 'center',
      visible: true,
    });
  }

  return {
    version: 1,
    elements,
    barcodeSymbology,
    barcodeSource: 'PRIMARY',
    priceSource: 'BASE',
  };
}

export const PRESET_LABEL_TEMPLATES = [
  {
    name: 'Rollo 38×25 mm',
    description: 'Etiqueta térmica continua estándar para retail',
    isDefault: true,
    isSystem: true,
    labelWidth: 38,
    labelHeight: 25,
    paperType: 'ROLL',
    layout: buildLayoutFromOptions(38, 25),
  },
  {
    name: 'Rollo 50×30 mm',
    description: 'Etiqueta térmica continua mediana',
    isDefault: false,
    isSystem: true,
    labelWidth: 50,
    labelHeight: 30,
    paperType: 'ROLL',
    layout: buildLayoutFromOptions(50, 30, { barcodeSymbology: 'EAN13' }),
  },
  {
    name: 'Hoja Avery 30 etiquetas',
    description: 'Hoja carta 8.5×11", etiqueta 2.625×1" (30 por hoja)',
    isDefault: false,
    isSystem: true,
    labelWidth: 66.675,
    labelHeight: 25.4,
    paperType: 'SHEET',
    paperWidth: 215.9,
    paperHeight: 279.4,
    marginTop: 12.7,
    marginLeft: 4.76,
    colGap: 3.175,
    colsPerRow: 3,
    labelsPerSheet: 30,
    layout: buildLayoutFromOptions(66.675, 25.4),
  },
] as const;
