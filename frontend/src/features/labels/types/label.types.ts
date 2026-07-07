export type BarcodeSymbology = 'EAN13' | 'CODE128' | 'QR' | 'NONE';

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
  type: 'TEXT' | 'BARCODE' | 'QR' | 'IMAGE' | 'LINE' | 'RECT';
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

export interface LabelTemplate {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isSystem: boolean;
  unit: string;
  labelWidth: number;
  labelHeight: number;
  paperType: 'ROLL' | 'SHEET';
  paperWidth?: number | null;
  paperHeight?: number | null;
  marginTop: number;
  marginLeft: number;
  rowGap: number;
  colGap: number;
  colsPerRow: number;
  labelsPerSheet?: number | null;
  layout: LabelLayout;
  createdAt: string;
  updatedAt: string;
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

export interface CreateLabelTemplateDto {
  name: string;
  description?: string;
  labelWidth: number;
  labelHeight: number;
  paperType?: 'ROLL' | 'SHEET';
  paperWidth?: number;
  paperHeight?: number;
  marginTop?: number;
  marginLeft?: number;
  rowGap?: number;
  colGap?: number;
  colsPerRow?: number;
  labelsPerSheet?: number;
  isDefault?: boolean;
  showStoreName?: boolean;
  showProductName?: boolean;
  showSizeColor?: boolean;
  showBarcode?: boolean;
  showPrice?: boolean;
  barcodeSymbology?: BarcodeSymbology;
}

export type UpdateLabelTemplateDto = Partial<CreateLabelTemplateDto>;
