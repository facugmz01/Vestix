import { QRCodeSVG } from 'qrcode.react';
import { Gift } from 'lucide-react';
import clsx from 'clsx';
import type { GiftCardRenderData, GiftCardTemplateSettings } from '../types/giftCardTemplate.types';
import styles from './GiftCardRenderer.module.css';

interface Props {
  template: GiftCardTemplateSettings;
  data: GiftCardRenderData;
  className?: string;
  qrRef?: React.Ref<SVGSVGElement>;
}

export function GiftCardRenderer({ template, data, className, qrRef }: Props) {
  const cardStyle = template.useGradient
    ? {
        background: `linear-gradient(145deg, ${template.backgroundColor} 0%, ${template.backgroundGradientEnd} 100%)`,
        color: template.textColor,
        borderRadius: `${template.borderRadiusPx}px`,
        fontFamily: template.fontFamily,
      }
    : {
        background: template.backgroundColor,
        color: template.textColor,
        borderRadius: `${template.borderRadiusPx}px`,
        fontFamily: template.fontFamily,
      };

  return (
    <div className={clsx(styles.card, className)} style={cardStyle}>
      {template.showLogo && template.logoUrl && (
        <img src={template.logoUrl} alt="Logo" className={styles.logo} />
      )}

      <div className={styles.brand}>
        <Gift size={14} />
        {template.brandLabel}
      </div>

      <h3 className={styles.title}>{template.title}</h3>
      {template.subtitle && <p className={styles.subtitle}>{template.subtitle}</p>}

      <div className={styles.amount} style={{ color: template.accentColor, fontSize: `${template.amountFontSizePx}px` }}>
        {data.amount}
      </div>

      {template.showCode && <div className={styles.code}>{data.code}</div>}

      {template.showRecipient && (
        <div className={styles.meta}>Para: {data.recipient}</div>
      )}

      {template.showExpiry && data.expiresAt && (
        <div className={styles.meta}>Vence: {data.expiresAt}</div>
      )}

      {template.showQr && (
        <div className={styles.qrWrap}>
          <QRCodeSVG
            ref={qrRef}
            value={data.verifyUrl}
            size={template.qrSizePx}
            level="H"
            includeMargin
          />
        </div>
      )}

      {template.footerText && (
        <p className={styles.footer}>{template.footerText}</p>
      )}
    </div>
  );
}
