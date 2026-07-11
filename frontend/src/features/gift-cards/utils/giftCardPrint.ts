import type { GiftCardRenderData, GiftCardTemplateSettings } from '../types/giftCardTemplate.types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function svgElementToDataUrl(svg: SVGSVGElement): string {
  const serialized = new XMLSerializer().serializeToString(svg);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
}

export function buildGiftCardStyles(template: GiftCardTemplateSettings): string {
  const background = template.useGradient
    ? `linear-gradient(145deg, ${template.backgroundColor} 0%, ${template.backgroundGradientEnd} 100%)`
    : template.backgroundColor;

  return `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: ${template.paperMarginMm}mm;
      font-family: ${template.fontFamily};
      background: #f3f4f6;
      color: ${template.textColor};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .card {
      width: ${template.cardWidthMm}mm;
      min-height: ${template.cardHeightMm}mm;
      padding: 8mm;
      border-radius: ${template.borderRadiusPx}px;
      background: ${background};
      color: ${template.textColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    }
    .brand {
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      opacity: 0.85;
    }
    .title {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
    }
    .subtitle {
      font-size: 12px;
      opacity: 0.8;
      margin: 0;
    }
    .logo {
      max-height: 28px;
      max-width: 120px;
      object-fit: contain;
    }
    .amount {
      font-size: ${template.amountFontSizePx}px;
      font-weight: 800;
      color: ${template.accentColor};
      font-family: monospace;
      margin: 4px 0;
    }
    .code {
      font-family: monospace;
      font-size: 13px;
      letter-spacing: 0.08em;
      opacity: 0.9;
    }
    .meta {
      font-size: 12px;
      opacity: 0.85;
      margin: 0;
    }
    .qr-wrap {
      background: #fff;
      padding: 8px;
      border-radius: 10px;
      line-height: 0;
    }
    .qr-wrap img {
      display: block;
      width: ${template.qrSizePx}px;
      height: ${template.qrSizePx}px;
    }
    .footer {
      font-size: 11px;
      opacity: 0.75;
      max-width: ${template.cardWidthMm - 10}mm;
      line-height: 1.4;
      margin: 0;
    }
    @media print {
      body { background: #fff; }
      .sheet { gap: 0; }
    }
  `;
}

export function buildGiftCardMarkup(
  template: GiftCardTemplateSettings,
  data: GiftCardRenderData,
): string {
  const parts: string[] = [];

  if (template.showLogo && data.verifyUrl && template.logoUrl) {
    parts.push(`<img class="logo" src="${escapeHtml(template.logoUrl)}" alt="Logo" />`);
  }

  parts.push(`<div class="brand">${escapeHtml(template.brandLabel)}</div>`);
  parts.push(`<h1 class="title">${escapeHtml(template.title)}</h1>`);

  if (template.subtitle) {
    parts.push(`<p class="subtitle">${escapeHtml(template.subtitle)}</p>`);
  }

  parts.push(`<div class="amount">${escapeHtml(data.amount)}</div>`);

  if (template.showCode) {
    parts.push(`<div class="code">${escapeHtml(data.code)}</div>`);
  }

  if (template.showRecipient) {
    parts.push(`<p class="meta">Para: ${escapeHtml(data.recipient)}</p>`);
  }

  if (template.showExpiry && data.expiresAt) {
    parts.push(`<p class="meta">Vence: ${escapeHtml(data.expiresAt)}</p>`);
  }

  if (template.showQr && data.qrDataUrl) {
    parts.push(`
      <div class="qr-wrap">
        <img src="${data.qrDataUrl}" alt="QR de verificación" />
      </div>
    `);
  }

  if (template.footerText) {
    parts.push(`<p class="footer">${escapeHtml(template.footerText)}</p>`);
  }

  return `
    <div class="sheet">
      <div class="card">
        ${parts.join('\n')}
      </div>
    </div>
  `;
}

export function buildGiftCardPrintDocument(
  template: GiftCardTemplateSettings,
  data: GiftCardRenderData,
  title: string,
): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>${buildGiftCardStyles(template)}</style>
  </head>
  <body>
    ${buildGiftCardMarkup(template, data)}
  </body>
</html>`;
}

export function printGiftCardHtml(html: string): void {
  const printWindow = window.open('', '_blank', 'width=480,height=720');
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 350);
}
