export type GiftCardFontFamily = 'sans-serif' | 'serif' | 'monospace';

export interface GiftCardTemplateSettings {
  brandLabel: string;
  title: string;
  subtitle?: string;
  backgroundColor: string;
  backgroundGradientEnd: string;
  useGradient: boolean;
  textColor: string;
  accentColor: string;
  cardWidthMm: number;
  cardHeightMm: number;
  borderRadiusPx: number;
  fontFamily: GiftCardFontFamily;
  amountFontSizePx: number;
  showLogo: boolean;
  logoUrl?: string;
  showQr: boolean;
  qrSizePx: number;
  showRecipient: boolean;
  showExpiry: boolean;
  showCode: boolean;
  footerText: string;
  paperMarginMm: number;
}

export const DEFAULT_GIFT_CARD_TEMPLATE: GiftCardTemplateSettings = {
  brandLabel: 'GIFT CARD',
  title: 'Tarjeta de regalo',
  subtitle: '',
  backgroundColor: '#1a1a2e',
  backgroundGradientEnd: '#0f3460',
  useGradient: true,
  textColor: '#ffffff',
  accentColor: '#e94560',
  cardWidthMm: 85,
  cardHeightMm: 54,
  borderRadiusPx: 16,
  fontFamily: 'sans-serif',
  amountFontSizePx: 28,
  showLogo: false,
  logoUrl: '',
  showQr: true,
  qrSizePx: 120,
  showRecipient: true,
  showExpiry: true,
  showCode: true,
  footerText: 'Escaneá el QR para validar la legitimidad de esta tarjeta.',
  paperMarginMm: 10,
};

export function resolveGiftCardTemplate(
  partial?: Partial<GiftCardTemplateSettings> | null,
): GiftCardTemplateSettings {
  return {
    ...DEFAULT_GIFT_CARD_TEMPLATE,
    ...(partial || {}),
    logoUrl: partial?.logoUrl?.trim() || '',
    subtitle: partial?.subtitle?.trim() || '',
  };
}

export interface GiftCardRenderData {
  amount: string;
  code: string;
  recipient: string;
  expiresAt?: string | null;
  verifyUrl: string;
  qrDataUrl?: string;
}
