export type ReceiptFontFamily = 'monospace' | 'sans-serif' | 'serif';
export type ReceiptDividerStyle = 'dashed' | 'solid' | 'dotted' | 'none';

export interface ReceiptStyleSettings {
  paperWidthMm: 58 | 70 | 80;
  fontFamily: ReceiptFontFamily;
  fontSizePx: number;
  headerFontSizePx: number;
  textColor: string;
  backgroundColor: string;
  accentColor: string;
  dividerStyle: ReceiptDividerStyle;
  showSku: boolean;
  showLineDiscounts: boolean;
  showPaymentMethod: boolean;
  showCustomer: boolean;
  showSubtotal: boolean;
  showDate: boolean;
  showTicketNumber: boolean;
  logoUrl?: string;
  titleFallback: string;
}

export const DEFAULT_RECEIPT_STYLE: ReceiptStyleSettings = {
  paperWidthMm: 80,
  fontFamily: 'monospace',
  fontSizePx: 12,
  headerFontSizePx: 14,
  textColor: '#000000',
  backgroundColor: '#ffffff',
  accentColor: '#000000',
  dividerStyle: 'dashed',
  showSku: true,
  showLineDiscounts: true,
  showPaymentMethod: true,
  showCustomer: true,
  showSubtotal: true,
  showDate: true,
  showTicketNumber: true,
  logoUrl: '',
  titleFallback: 'TICKET DE VENTA',
};

export function resolveReceiptStyle(
  partial?: Partial<ReceiptStyleSettings> | null,
): ReceiptStyleSettings {
  return {
    ...DEFAULT_RECEIPT_STYLE,
    ...partial,
    logoUrl: partial?.logoUrl?.trim() || '',
  };
}

export function receiptFontStack(fontFamily: ReceiptFontFamily): string {
  switch (fontFamily) {
    case 'sans-serif':
      return "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
    case 'serif':
      return "Georgia, 'Times New Roman', serif";
    default:
      return "'Courier New', Courier, monospace";
  }
}

export function receiptDividerCss(style: ReceiptDividerStyle, color: string): string {
  switch (style) {
    case 'solid':
      return `1px solid ${color}`;
    case 'dotted':
      return `1px dotted ${color}`;
    case 'none':
      return 'none';
    default:
      return `1px dashed ${color}`;
  }
}
