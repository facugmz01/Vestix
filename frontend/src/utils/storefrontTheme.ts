export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 102, 204';
}

/** Injects storefront light-mode tokens and brand accent overrides. */
export function buildStorefrontThemeCss(primaryColor: string): string {
  const rgb = hexToRgb(primaryColor);
  return `
    :root, html.dark {
      --surface-0: #FFFFFF;
      --surface-1: #F5F5F7;
      --surface-2: #E8E8ED;
      --bg-base: #FAFAFC;
      --bg-surface: #FFFFFF;
      --bg-surface-hover: #F5F5F7;
      --bg-elevated: #FFFFFF;
      --bg-overlay: rgba(15, 23, 42, 0.04);
      --text-primary: #0F172A;
      --text-secondary: #475569;
      --text-muted: #64748B;
      --text-inverted: #FFFFFF;
      --border: #E2E8F0;
      --border-strong: #CBD5E1;
      --accent: ${primaryColor};
      --accent-rgb: ${rgb};
      --accent-subtle: rgba(${rgb}, 0.1);
      --accent-hover: ${primaryColor};
      --accent-glow: rgba(${rgb}, 0.2);
      --sf-primary: ${primaryColor};
      --sf-primary-rgb: ${rgb};
      --sf-primary-subtle: rgba(${rgb}, 0.1);
      --sf-primary-hover: ${primaryColor};
    }
  `;
}
