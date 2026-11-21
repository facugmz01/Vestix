/** The public storefront has one supported visual system. */
export type StorefrontTheme = 'editorial';

export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 102, 204';
}

/** Injects storefront tokens and brand overrides based on the active theme. */
export function buildStorefrontThemeCss(primaryColor: string, _theme: StorefrontTheme = 'editorial'): string {
  const rgb = hexToRgb(primaryColor);

  const themeOverrides = `
      :root, html.dark {
        --surface-0: #fbf8f2;
        --surface-1: #f1ebe2;
        --surface-2: #e7ddd1;
        --bg-base: #f6f2eb;
        --bg-surface: #fbf8f2;
        --bg-surface-hover: #eee5da;
        --bg-elevated: #fffdf9;
        --text-primary: #171512;
        --text-secondary: #534b42;
        --text-muted: #746b62;
        --text-inverted: #fbf8f2;
        --border: #d8cfc4;
        --border-strong: #b9ada0;
        --radius: 0px;
        --radius-lg: 0px;
        --sf-paper: #f6f2eb;
        --sf-ink: #171512;
        --sf-muted: #746b62;
        --sf-coral: #dc684b;
        --sf-surface: #fbf8f2;
        --sf-focus: #dc684b;
      }
      .storefront-theme-editorial {
        background: var(--sf-paper) !important;
        color: var(--sf-ink) !important;
      }
      .storefront-theme-editorial :where(button, a, input, select, textarea):focus-visible {
        outline: 3px solid rgba(220, 104, 75, .42);
        outline-offset: 3px;
      }
      .storefront-theme-editorial .storefront-input,
      .storefront-theme-editorial input,
      .storefront-theme-editorial select,
      .storefront-theme-editorial textarea {
        border-radius: 0 !important;
        border-color: var(--border) !important;
        background: var(--surface-0) !important;
        color: var(--text-primary) !important;
      }
      .storefront-theme-editorial .storefront-btn {
        min-height: 44px;
        border-radius: 0 !important;
        background: var(--sf-ink) !important;
        border-color: var(--sf-ink) !important;
        color: var(--text-inverted) !important;
        box-shadow: none !important;
      }
      .storefront-theme-editorial .storefront-btn:hover:not(:disabled) {
        background: var(--sf-coral) !important;
        border-color: var(--sf-coral) !important;
      }
      .storefront-theme-editorial .storefront-btn-secondary {
        background: transparent !important;
        color: var(--sf-ink) !important;
        border-color: var(--border-strong) !important;
      }
      .storefront-theme-editorial .storefront-checkout-container {
        max-width: 1320px;
        margin-inline: auto;
      }
      .storefront-theme-editorial .storefront-card {
        border-radius: 0 !important;
        box-shadow: none !important;
        border-color: var(--border) !important;
        background: var(--surface-0) !important;
      }
      .storefront-theme-editorial .storefront-page-title,
      .storefront-theme-editorial .storefront-page h1,
      .storefront-theme-editorial .storefront-page h2 {
        letter-spacing: -.04em;
      }
      @media (prefers-reduced-motion: reduce) {
        .storefront-theme-editorial *,
        .storefront-theme-editorial *::before,
        .storefront-theme-editorial *::after {
          animation-duration: .01ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
          transition-duration: .01ms !important;
        }
      }
      html.dark .storefront-theme-editorial {
        --surface-0: #211f1c;
        --surface-1: #2a2723;
        --surface-2: #38322c;
        --bg-base: #181715;
        --bg-surface: #211f1c;
        --text-primary: #fbf8f2;
        --text-secondary: #d8cfc4;
        --text-muted: #b9ada0;
        --text-inverted: #171512;
        --border: #51483f;
        --border-strong: #746b62;
        --sf-paper: #181715;
        --sf-ink: #fbf8f2;
        --sf-surface: #211f1c;
      }
    `;

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
