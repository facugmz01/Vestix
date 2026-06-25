/**
 * All system-wide configuration lives in a single structured model.
 * Stored as a single row in the DB (singleton pattern) with strict versioning.
 * Changes are immutable audit events — we never overwrite, we append.
 */
export interface SystemSettings {
  version: number; // Monotonically increasing. Guards against stale reads.

  // ─── STORE IDENTITY ───────────────────────────────────────────────────────
  store: {
    name: string;           // "Mi Tienda SRL"
    legalName: string;      // Official AFIP-registered legal name
    cuit: string;           // Argentine Tax ID: "30-12345678-1"
    currency: string;       // Default currency: "ARS"
    timezone: string;       // e.g. "America/Argentina/Buenos_Aires"
    logoUrl?: string;
  };

  // ─── SKU GENERATION RULES ────────────────────────────────────────────────
  sku: {
    prefix: string;          // Global prefix prepended to all SKUs, e.g. "TDA"
    includeCategory: boolean; // Whether to include category code segment
    includeBrand: boolean;    // Whether to include brand code segment
    includeColor: boolean;
    includeSize: boolean;
    separator: string;        // e.g. "-" → "TDA-TSH-BLK-M"
    uppercased: boolean;
  };

  // ─── BARCODE GENERATION RULES ────────────────────────────────────────────
  barcode: {
    companyPrefix: string; // GS1 assigned 7-digit prefix, e.g. "0400000"
    autoGenerate: boolean; // True = auto-assign EAN-13 on variant creation
  };

  // ─── PRICING DEFAULTS ────────────────────────────────────────────────────
  pricing: {
    defaultVatRate: number;          // e.g. 0.21 (21% IVA Argentina)
    defaultMarginTarget: number;     // e.g. 0.45 (45% gross margin target)
    allowNegativeMargin: boolean;    // If false, blocks pricing below cost
    roundToNearest: number;          // e.g. 0.5 → rounds $19.73 → $19.50
    defaultRetailPriceListId: string;
    defaultWholesalePriceListId?: string;
  };

  // ─── INVENTORY RULES ─────────────────────────────────────────────────────
  inventory: {
    allowNegativeStock: boolean;     // Super Admin override only
    defaultReorderPoint: number;     // Units below which low-stock alerts fire
    reservationTtlMinutes: number;   // How long cart holds last (default 15)
  };

  // ─── OFFLINE POS RULES ───────────────────────────────────────────────────
  offline: {
    maxOfflineHours: number;         // After this, POS forces a re-sync before new sales
    requireManagerPinForReturns: boolean;
    requireManagerPinForDiscounts: boolean;
  };

  // ─── NOTIFICATIONS & INTEGRATIONS ──────────────────────────────────────────
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    whatsappEnabled: boolean;
    pushEnabled: boolean;
    lowStockThreshold: number;
    notifyOnSale: boolean;
    notifyOnPurchase: boolean;
    notifyOnLowStock: boolean;
    notifyOnTransfer: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smsGatewayUrl?: string;
    // Evolution API (WhatsApp)
    evolutionApiUrl?: string;
    evolutionApiKey?: string;
    evolutionInstance?: string;
  };

  integrations: {
    mercadopagoEnabled: boolean;
    mercadolibreEnabled: boolean;
    woocommerceEnabled: boolean;
    shopifyEnabled: boolean;
    mlAppId?: string;
    mlSecretKey?: string;
    shopifyStoreUrl?: string;
    shopifyAccessToken?: string;
    wooStoreUrl?: string;
    wooConsumerKey?: string;
    wooConsumerSecret?: string;
  };

  updatedAt: Date;
  updatedByUserId: string;
}
