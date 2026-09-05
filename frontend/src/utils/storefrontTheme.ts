export type StorefrontTheme = 'classic' | 'minimal' | 'streetwear' | 'catalog' | 'app_like';

export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 102, 204';
}

/** Injects storefront tokens and brand overrides based on the active theme. */
export function buildStorefrontThemeCss(primaryColor: string, theme: StorefrontTheme = 'classic'): string {
  const rgb = hexToRgb(primaryColor);

  let themeOverrides = '';

  if (theme === 'minimal') {
    themeOverrides = `
      :root, html.dark {
        --surface-0: #FFFFFF;
        --surface-1: #FAFAFB;
        --surface-2: #F4F4F6;
        --bg-base: #FCFCFD;
        --bg-surface: #FFFFFF;
        --text-primary: #18181B;
        --text-secondary: #52525B;
        --text-muted: #71717A;
        --border: #F1F1F4;
        --border-strong: #E4E4E7;
        --radius: 4px;
        --radius-lg: 6px;
      }
      .storefront-theme-minimal .theme-card-img {
        aspect-ratio: 3 / 4 !important;
        border-radius: 4px;
      }
      .storefront-theme-minimal .theme-product-card {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
      }
      .storefront-theme-minimal .theme-product-card:hover {
        transform: translateY(-2px);
      }
    `;
  } else if (theme === 'streetwear') {
    themeOverrides = `
      :root, html.dark {
        --surface-0: #09090B;
        --surface-1: #18181B;
        --surface-2: #27272A;
        --bg-base: #000000;
        --bg-surface: #09090B;
        --bg-surface-hover: #18181B;
        --text-primary: #FFFFFF;
        --text-secondary: #A1A1AA;
        --text-muted: #71717A;
        --text-inverted: #000000;
        --border: #27272A;
        --border-strong: #3F3F46;
        --radius: 2px;
        --radius-lg: 4px;
      }
      .storefront-theme-streetwear {
        background: #000000 !important;
        color: #FFFFFF !important;
      }
      .storefront-theme-streetwear .theme-product-card {
        background: #121215 !important;
        border: 1px solid #27272A !important;
        border-radius: 4px !important;
      }
      .storefront-theme-streetwear .theme-card-img {
        aspect-ratio: 4 / 5 !important;
      }
    `;
  } else if (theme === 'catalog') {
    themeOverrides = `
      :root, html.dark {
        --surface-0: #FFFFFF;
        --surface-1: #F8FAFC;
        --surface-2: #F1F5F9;
        --bg-base: #F8FAFC;
        --bg-surface: #FFFFFF;
        --border: #E2E8F0;
        --border-strong: #CBD5E1;
        --radius: 8px;
      }
      .storefront-theme-catalog .theme-product-card {
        border: 1px solid #E2E8F0 !important;
        border-radius: 8px !important;
        padding: 8px;
        background: #FFFFFF !important;
      }
      .storefront-theme-catalog .theme-card-img {
        aspect-ratio: 1 / 1 !important;
        border-radius: 6px;
      }
    `;
  } else if (theme === 'app_like') {
    themeOverrides = `
      :root, html.dark {
        --surface-0: #FFFFFF;
        --surface-1: #F8FAFC;
        --surface-2: #F1F5F9;
        --bg-base: #F8FAFC;
        --bg-surface: #FFFFFF;
        --border: #F1F5F9;
        --border-strong: #E2E8F0;
        --radius: 20px;
        --radius-lg: 24px;
      }
      .storefront-theme-app_like {
        padding-bottom: 72px;
      }
      .storefront-theme-app_like .theme-product-card {
        border-radius: 20px !important;
        border: 1px solid #F1F5F9 !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.03) !important;
      }
      .storefront-theme-app_like .theme-card-img {
        aspect-ratio: 4 / 5 !important;
        border-radius: 16px;
      }
    `;
  }

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
    ${themeOverrides}
  `;
}
