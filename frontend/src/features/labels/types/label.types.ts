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
  | 'logo'
  | 'custom';

export type LabelElementType = 'TEXT' | 'BARCODE' | 'QR' | 'IMAGE' | 'LINE' | 'RECT';

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
  barcodeSource: 'PRIMARY' | 'SKU' | 'SECONDARY';
  priceSource: 'BASE' | 'PRICE_LIST';
  priceListId?: string;
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
  logoUrl?: string;
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
  layout?: LabelLayout;
  isDefault?: boolean;
  priceSource?: 'BASE' | 'PRICE_LIST';
  priceListId?: string;
  showStoreName?: boolean;
  showProductName?: boolean;
  showSizeColor?: boolean;
  showBarcode?: boolean;
  showPrice?: boolean;
  barcodeSymbology?: BarcodeSymbology;
}

export type UpdateLabelTemplateDto = Partial<CreateLabelTemplateDto>;

export interface LabelTemplateExport {
  version: 1;
  exportedAt: string;
  template: Omit<CreateLabelTemplateDto, 'isDefault'> & {
    layout: LabelLayout;
  };
}

export const FIELD_LABELS: Record<LabelField, string> = {
  storeName: 'Nombre de tienda',
  productName: 'Producto',
  sku: 'SKU',
  barcode: 'Código de barras',
  size: 'Talle',
  color: 'Color',
  sizeColor: 'Talle y color',
  price: 'Precio',
  brand: 'Marca',
  category: 'Categoría',
  logo: 'Logo',
  custom: 'Texto personalizado',
};

export function createDefaultLayout(width: number, height: number): LabelLayout {
  return {
    version: 1,
    elements: [
      { id: 'store', type: 'TEXT', field: 'storeName', x: 1, y: 1, width: width - 2, fontSize: 6, fontWeight: 'bold', textAlign: 'center', visible: true },
      { id: 'product', type: 'TEXT', field: 'productName', x: 1, y: 4, width: width - 2, fontSize: 8, fontWeight: 'bold', textAlign: 'center', visible: true },
      { id: 'attrs', type: 'TEXT', field: 'sizeColor', x: 1, y: 8, width: width - 2, fontSize: 6, textAlign: 'center', visible: true },
      { id: 'barcode', type: 'BARCODE', field: 'barcode', x: 2, y: 11, width: width - 4, height: 8, visible: true },
      { id: 'price', type: 'TEXT', field: 'price', x: 1, y: height - 4, width: width - 2, fontSize: 9, fontWeight: 'bold', textAlign: 'center', visible: true },
    ],
    barcodeSymbology: 'EAN13',
    barcodeSource: 'PRIMARY',
    priceSource: 'BASE',
  };
}

export function newElementId() {
  return `el_${Math.random().toString(36).slice(2, 9)}`;
}
