import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/models/audit-log.model';
import { EncryptionService } from '../../core/crypto/encryption.service';
import * as nodemailer from 'nodemailer';
import { UpdateSettingsDto } from './dto/settings.dto';

// ─── Sensitive field maps — fields to encrypt/decrypt per section ──────────────

const SENSITIVE_FIELDS: Record<string, string[]> = {
  notifications: ['smtpPass', 'evolutionApiKey', 'fcmServerKey'],
  integrations:  ['mpAccessToken', 'mpWebhookSecret', 'mlSecretKey', 'wooConsumerSecret', 'shopifyAccessToken'],
};

/** Sentinel returned by maskSection — never a real credential. */
const MASK_VALUE = '••••••••';

// ─── Typed interfaces for internal use ────────────────────────────────────────

export interface GeneralSettings {
  companyName: string;
  legalName: string;
  taxId: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  timezone: string;
  locale: string;
  currency: string;
}

export interface PricingSettings {
  defaultPriceListId: string;
  vatDefaultPct: number;
  allowManualDiscount: boolean;
  maxDiscountPct: number;
  roundingRule: 'NONE' | 'NEAREST_10' | 'UP' | 'DOWN';
  showPricesWithTax: boolean;
  usdOfficialRate?: number;
  usdBlueRate?: number;
}

export interface PosSettings {
  allowNegativeStock: boolean;
  thermalPrint80mm: boolean;
  fiscalPrint70mm: boolean;
  boxMode: string;
  defaultPriceType: string;
  requireInternalCode: boolean;
  requireBarcode: boolean;
  requireBrand: boolean;
  requireDescription: boolean;
  requireShippingDimensions: boolean;
  officialDollarQuote: number;
  blueDollarQuote: number;
}

export interface NotificationSettings {
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
  smtpPass?: string;      // Decrypted at runtime
  smsGatewayUrl?: string;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;  // Decrypted at runtime
  evolutionInstance?: string;
  fcmServerKey?: string;     // Decrypted at runtime
}

export interface StorefrontSettings {
  enabled: boolean;
  primaryColor: string;
  fontFamily: string;
  showHeader: boolean;
  showStoreName: boolean;
  imagesCarousel: any[];
  priceListToShow: string;
  defaultSort: string;
  hideOutOfStock: boolean;
  hideBrandFilters: boolean;
  transferCbu?: string;
  acceptCash: boolean;
  shippingInfo: string;
  requireShippingData: string;
  whatsapp: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  youtubeUrl: string;
  xUrl: string;
  subdomain?: string;
  allowedPaymentMethods?: string[];
  shippingMethods?: any[];
}

export interface IntegrationSettings {
  mercadopagoEnabled: boolean;
  mercadolibreEnabled: boolean;
  woocommerceEnabled: boolean;
  shopifyEnabled: boolean;
  mpPublicKey?: string;
  mpAccessToken?: string;   // Decrypted at runtime
  mpWebhookSecret?: string; // Decrypted at runtime
  mlAppId?: string;
  mlSecretKey?: string;     // Decrypted at runtime
  shopifyStoreUrl?: string;
  shopifyAccessToken?: string; // Decrypted at runtime
  wooStoreUrl?: string;
  wooConsumerKey?: string;
  wooConsumerSecret?: string;  // Decrypted at runtime
}

export interface PwaSettings {
  appName: string;
  appShortName: string;
  themeColor: string;
  backgroundColor: string;
  iconUrl: string;
}

export interface SkuBarcodeSettings {
  skuPrefix: string;
  skuAutoGenerate: boolean;
  barcodeFormat: string;
  barcodeAutoGenerate: boolean;
  nextSkuSequence: number;
}

export interface ArcaSettings {
  enabled: boolean;
  pointOfSale: string | number;
  environment: string;
  startDate: string;
  iibb: string;
  cuit: string;
  certAlias: string;
}

export interface OfflineSettings {
  offlineModeEnabled: boolean;
  posOfflineTtlHours: number;
  maxQueueSize: number;
  autoSyncOnReconnect: boolean;
  conflictStrategy: string;
}

// ─── Cache entry ──────────────────────────────────────────────────────────────

interface CacheEntry {
  data: any;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 seconds

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cache: CacheEntry | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly encryption: EncryptionService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultSettings();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INTERNAL HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  /** Removes NaN, null, undefined from a section object before merging to DB. */
  private sanitizeSection(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => {
        if (v === null || v === undefined) return false;
        if (typeof v === 'number' && isNaN(v)) return false;
        return true;
      }),
    );
  }

  /**
   * Removes sensitive fields that carry the mask sentinel value from an incoming DTO.
   * This prevents the UI's placeholder "••••••••" from overwriting a real stored credential.
   */
  private stripMaskedFields(sectionKey: string, dto: Record<string, any>): Record<string, any> {
    const sensitiveKeys = SENSITIVE_FIELDS[sectionKey];
    if (!sensitiveKeys) return dto;
    const result = { ...dto };
    for (const key of sensitiveKeys) {
      if (result[key] === MASK_VALUE || result[key] === '') {
        delete result[key]; // keep whatever is already in DB
      }
    }
    return result;
  }

  /** Encrypts sensitive fields in a section before persisting. */
  private encryptSection(sectionKey: string, data: Record<string, any>): Record<string, any> {
    const sensitiveKeys = SENSITIVE_FIELDS[sectionKey];
    if (!sensitiveKeys) return data;
    const result = { ...data };
    for (const key of sensitiveKeys) {
      if (result[key] && typeof result[key] === 'string' && result[key] !== '') {
        result[key] = this.encryption.encrypt(result[key]);
      }
    }
    return result;
  }

  /** Decrypts sensitive fields in a section after reading from DB. */
  private decryptSection(sectionKey: string, data: Record<string, any>): Record<string, any> {
    const sensitiveKeys = SENSITIVE_FIELDS[sectionKey];
    if (!sensitiveKeys) return data;
    const result = { ...data };
    for (const key of sensitiveKeys) {
      if (result[key] && typeof result[key] === 'string') {
        result[key] = this.encryption.decrypt(result[key]);
      }
    }
    return result;
  }

  /** Masks sensitive fields in a section for safe HTTP responses. */
  private maskSection(sectionKey: string, data: Record<string, any>): Record<string, any> {
    const sensitiveKeys = SENSITIVE_FIELDS[sectionKey];
    if (!sensitiveKeys) return data;
    const result = { ...data };
    for (const key of sensitiveKeys) {
      if (result[key]) {
        result[key] = this.encryption.mask(result[key]);
      }
    }
    return result;
  }

  /**
   * Decrypts all sections of a raw DB row for internal use.
   */
  private decryptRow(row: any): any {
    return {
      ...row,
      notifications: row.notifications
        ? this.decryptSection('notifications', row.notifications as any)
        : row.notifications,
      integrations: row.integrations
        ? this.decryptSection('integrations', row.integrations as any)
        : row.integrations,
    };
  }

  /**
   * Returns a version safe for HTTP responses — decrypted then masked.
   */
  private maskForResponse(row: any): any {
    const decrypted = this.decryptRow(row);
    return {
      ...decrypted,
      notifications: decrypted.notifications
        ? this.maskSection('notifications', decrypted.notifications as any)
        : decrypted.notifications,
      integrations: decrypted.integrations
        ? this.maskSection('integrations', decrypted.integrations as any)
        : decrypted.integrations,
    };
  }

  /** Invalidates the in-memory cache. */
  private invalidateCache() {
    this.cache = null;
  }

  /**
   * Reads from in-memory cache (decrypted) or DB.
   * Used by internal typed getters — returns DECRYPTED values.
   */
  private async getCachedRaw(): Promise<any> {
    const now = Date.now();
    if (this.cache && now < this.cache.expiresAt) {
      return this.cache.data;
    }
    const row = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    if (!row) {
      await this.ensureDefaultSettings();
      return this.getCachedRaw();
    }
    const decrypted = this.decryptRow(row);
    this.cache = { data: decrypted, expiresAt: now + CACHE_TTL_MS };
    return decrypted;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TYPED GETTERS (for internal service consumption)
  // ───────────────────────────────────────────────────────────────────────────

  async getGeneralSettings(): Promise<GeneralSettings> {
    const row = await this.getCachedRaw();
    return (row?.general as GeneralSettings) ?? {} as GeneralSettings;
  }

  async getPricingSettings(): Promise<PricingSettings> {
    const row = await this.getCachedRaw();
    return (row?.pricing as PricingSettings) ?? {} as PricingSettings;
  }

  async getPosSettings(): Promise<PosSettings> {
    const row = await this.getCachedRaw();
    return (row?.pos as PosSettings) ?? {} as PosSettings;
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    const row = await this.getCachedRaw();
    return (row?.notifications as NotificationSettings) ?? {} as NotificationSettings;
  }

  async getStorefrontSettings(): Promise<StorefrontSettings> {
    const row = await this.getCachedRaw();
    return (row?.storefront as StorefrontSettings) ?? {} as StorefrontSettings;
  }

  async getIntegrationSettings(): Promise<IntegrationSettings> {
    const row = await this.getCachedRaw();
    return (row?.integrations as IntegrationSettings) ?? {} as IntegrationSettings;
  }

  async getPwaSettings(): Promise<PwaSettings> {
    const row = await this.getCachedRaw();
    return (row?.pwa as PwaSettings) ?? {} as PwaSettings;
  }

  async getSkuBarcodeSettings(): Promise<SkuBarcodeSettings> {
    const row = await this.getCachedRaw();
    return (row?.skuBarcode as SkuBarcodeSettings) ?? {} as SkuBarcodeSettings;
  }

  async getArcaSettings(): Promise<ArcaSettings> {
    const row = await this.getCachedRaw();
    return (row?.arca as ArcaSettings) ?? {} as ArcaSettings;
  }

  async getOfflineSettings(): Promise<OfflineSettings> {
    const row = await this.getCachedRaw();
    return (row?.offline as OfflineSettings) ?? {} as OfflineSettings;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PUBLIC API METHODS
  // ───────────────────────────────────────────────────────────────────────────

  /** Returns settings safe for HTTP responses (masked sensitive fields). */
  async getSettings() {
    const row = await this.getCachedRaw();
    return this.maskForResponse(row);
  }

  /**
   * Updates a single section atomically. Encrypts sensitive fields before persisting.
   * This is the preferred update path (called by PATCH /settings/:section).
   */
  async updateSection(section: string, dto: Record<string, any>, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const current = await tx.systemSettings.findUnique({ where: { id: 'default' } });
      if (!current) throw new Error('SystemSettings default row not found');

      const currentSection = ((current as any)[section] as Record<string, any>) ?? {};
      // Strip mask sentinels BEFORE sanitizing so the stored encrypted value is preserved.
      const stripped = this.stripMaskedFields(section, dto);
      const sanitized = this.sanitizeSection(stripped);
      const merged = { ...currentSection, ...sanitized };
      const encrypted = this.encryptSection(section, merged);

      const updated = await tx.systemSettings.update({
        where: { id: 'default' },
        data: { [section]: encrypted },
      });

      // Side effect: sync Branch.settings when general is updated
      if (section === 'general') {
        await this.syncGeneralToBranch(tx, encrypted as GeneralSettings);
      }

      await this.auditService.log({
        userId,
        action: AuditAction.UPDATE,
        resource: 'SystemSettings',
        resourceId: 'default',
        module: 'SettingsService',
        previousValue: { [section]: currentSection },
        newValue: { [section]: merged }, // Log unencrypted for readability (masked later if needed)
        description: `Updated settings section: ${section}`,
      });

      this.invalidateCache();
      return this.maskForResponse(updated);
    });
  }

  /**
   * Legacy bulk update — still supported for backward compatibility.
   * Prefer updateSection() for new code.
   */
  async updateAllSettings(dto: UpdateSettingsDto, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const current = await tx.systemSettings.findUnique({ where: { id: 'default' } });
      if (!current) throw new Error('SystemSettings default row not found');

      const sections = ['general', 'pricing', 'skuBarcode', 'invoicing', 'notifications',
                        'integrations', 'offline', 'pos', 'arca', 'storefront', 'pwa', 'qr'] as const;

      const dataToUpdate: any = {};
      for (const s of sections) {
        if ((dto as any)[s]) {
          const current_ = ((current as any)[s] as object) ?? {};
          const stripped = this.stripMaskedFields(s, (dto as any)[s]);
          const sanitized = this.sanitizeSection(stripped);
          const merged = { ...current_, ...sanitized };
          dataToUpdate[s] = this.encryptSection(s, merged);
        }
      }

      const updated = await tx.systemSettings.update({
        where: { id: 'default' },
        data: dataToUpdate,
      });

      if (dto.general) {
        await this.syncGeneralToBranch(tx, dataToUpdate.general);
      }

      await this.auditService.log({
        userId,
        action: AuditAction.UPDATE,
        resource: 'SystemSettings',
        resourceId: 'default',
        module: 'SettingsService',
        previousValue: { sections: Object.keys(dataToUpdate) },
        newValue: { sections: Object.keys(dataToUpdate) },
        description: `Updated system settings (bulk): ${Object.keys(dataToUpdate).join(', ')}`,
      });

      this.invalidateCache();
      return this.maskForResponse(updated);
    });
  }

  /** Syncs general settings into the main Branch record. */
  private async syncGeneralToBranch(tx: any, g: GeneralSettings) {
    const branch = await tx.branch.findFirst({ where: { isMain: true } });
    if (!branch) return;
    const currentSettings = (branch.settings as any) ?? {};
    await tx.branch.update({
      where: { id: branch.id },
      data: {
        name: g.companyName ? `${g.companyName} - Casa Central` : branch.name,
        address: g.address || branch.address,
        phone: g.phone || branch.phone,
        settings: {
          ...currentSettings,
          taxId: g.taxId,
          companyName: g.companyName,
          companyEmail: g.email,
          companyPhone: g.phone,
          companyAddress: g.address,
        },
      },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONNECTION TESTS
  // ───────────────────────────────────────────────────────────────────────────

  async testAfipConnection() {
    // TODO: Implement actual AFIP ping when AFIP module is production-ready.
    // Currently returns a simulated response.
    return {
      success: false,
      message: 'Prueba de conexión AFIP no disponible aún. Configurá los certificados en la pestaña ARCA.',
    };
  }

  async testSmtpConnection(dto: any) {
    try {
      if (!dto.smtpHost) return { success: false, message: 'Host SMTP no configurado' };
      // Resolve the real password if the UI sent back the mask sentinel
      let smtpPass = dto.smtpPass;
      if (!smtpPass || smtpPass === MASK_VALUE) {
        const stored = await this.getNotificationSettings();
        smtpPass = stored.smtpPass || '';
      }
      const transporter = nodemailer.createTransport({
        host: dto.smtpHost,
        port: Number(dto.smtpPort) || 587,
        secure: Number(dto.smtpPort) === 465,
        auth: {
          user: dto.smtpUser,
          pass: smtpPass,
        },
      });
      await transporter.verify();
      return { success: true, message: 'Conexión SMTP exitosa. Credenciales válidas.' };
    } catch (error: any) {
      this.logger.error(`Error SMTP: ${error.message}`);
      return { success: false, message: `Error SMTP: ${error.message}` };
    }
  }

  async testSmsConnection(dto: any) {
    try {
      if (!dto.smsGatewayUrl) return { success: false, message: 'URL del Gateway SMS no configurada' };
      const res = await fetch(dto.smsGatewayUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) }).catch(() => null);
      if (res && res.ok) {
        return { success: true, message: 'Conexión SMS Gateway exitosa.' };
      }
      return { success: true, message: 'Ping enviado. Verificá en el dispositivo si recibió la petición.' };
    } catch (error: any) {
      return { success: false, message: `Fallo de conexión HTTP: ${error.message}` };
    }
  }

  async testWhatsappConnection(dto: any) {
    try {
      const url = dto.evolutionApiUrl;
      if (!url) return { success: false, message: 'URL de Evolution API no configurada' };
      // Resolve the real API key if the UI sent back the mask sentinel
      let apiKey = dto.evolutionApiKey;
      if (!apiKey || apiKey === MASK_VALUE) {
        const stored = await this.getNotificationSettings();
        apiKey = stored.evolutionApiKey || '';
      }
      if (!apiKey) return { success: false, message: 'API Key de Evolution no configurada' };
      const instance = dto.evolutionInstance || 'store-main';
      const endpoint = `${url.replace(/\/+$/, '')}/instance/connectionState/${instance}`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'apikey': apiKey },
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => ({})) as any;
        const isReady = data?.instance?.state === 'open';
        return {
          success: true,
          message: isReady
            ? 'Evolution API conectada y sesión activa ✓'
            : 'Evolution API alcanzable, pero la sesión no está conectada (escanea el QR en el Manager).',
        };
      }
      return { success: false, message: `Evolution API no responde. Status: ${res?.status ?? 'sin respuesta'}. Revisá la URL y API Key.` };
    } catch (error: any) {
      return { success: false, message: `Fallo al conectar con Evolution API: ${error.message}` };
    }
  }

  async testPushConnection(dto: any) {
    try {
      // Resolve the real FCM key if the UI sent back the mask sentinel
      let fcmServerKey = dto.fcmServerKey;
      if (!fcmServerKey || fcmServerKey === MASK_VALUE) {
        const stored = await this.getNotificationSettings();
        fcmServerKey = stored.fcmServerKey || '';
      }
      if (!fcmServerKey) return { success: false, message: 'Server Key de FCM no configurada' };
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: { 'Authorization': `key=${fcmServerKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'test-token', notification: { title: 'Test', body: 'Test Push' } }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 401) return { success: false, message: 'FCM Server Key inválida.' };
      return { success: true, message: 'Credenciales FCM validadas correctamente.' };
    } catch (error: any) {
      return { success: false, message: `Error FCM: ${error.message}` };
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPRICE USD
  // ───────────────────────────────────────────────────────────────────────────

  async repriceUsd(usdType: 'Oficial' | 'Blue') {
    return this.prisma.$transaction(async (tx) => {
      const posSettings = await this.getPosSettings();
      const newRate = usdType === 'Oficial' ? posSettings.officialDollarQuote : posSettings.blueDollarQuote;
      if (!newRate) throw new Error('No USD rate configured');

      const products = await tx.product.findMany({
        where: { metadata: { path: ['usdCurrency'], equals: usdType } },
        include: { variants: true },
      });

      let updatedCount = 0;
      for (const product of products) {
        const metadata: any = product.metadata || {};
        const costUsd = metadata.costUsd || 0;
        if (costUsd > 0) {
          await tx.product.update({ where: { id: product.id }, data: { costPrice: costUsd * newRate } });
          for (const variant of product.variants) {
            const vMetadata: any = variant.attributes || {};
            const vCostUsd = vMetadata.costUsd || costUsd;
            if (vCostUsd > 0) {
              await tx.productVariant.update({ where: { id: variant.id }, data: { costPrice: vCostUsd * newRate } });
            }
          }
          updatedCount++;
        }
      }
      return { success: true, updatedCount };
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // BOOTSTRAP
  // ───────────────────────────────────────────────────────────────────────────

  private async ensureDefaultSettings() {
    const row = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    if (!row) {
      this.logger.log('No SystemSettings found. Creating default singleton...');
      await this.prisma.systemSettings.create({
        data: {
          id: 'default',
          general: {
            companyName: 'Mi Empresa', legalName: 'Mi Empresa SRL', taxId: '30-00000000-0',
            address: '', phone: '', email: '', timezone: 'America/Argentina/Buenos_Aires',
            locale: 'es-AR', currency: 'ARS',
          },
          pricing: {
            defaultPriceListId: 'retail-default', vatDefaultPct: 21,
            allowManualDiscount: true, maxDiscountPct: 100,
            roundingRule: 'NONE', showPricesWithTax: true,
          },
          skuBarcode: {
            skuPrefix: 'SKU', skuAutoGenerate: true,
            barcodeFormat: 'EAN13', barcodeAutoGenerate: true, nextSkuSequence: 1,
          },
          invoicing: { defaultInvoiceType: 'FACTURA_B', autoIssueOnSale: false },
          notifications: {
            emailEnabled: false, smsEnabled: false, whatsappEnabled: false, pushEnabled: false,
            lowStockThreshold: 5, notifyOnSale: false, notifyOnPurchase: false,
            notifyOnLowStock: true, notifyOnTransfer: false,
            smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '',
            smsGatewayUrl: '', evolutionApiUrl: '', evolutionApiKey: '',
            evolutionInstance: 'store-main', fcmServerKey: '',
          },
          integrations: {
            mercadopagoEnabled: false, mercadolibreEnabled: false,
            woocommerceEnabled: false, shopifyEnabled: false,
            mlAppId: '', mlSecretKey: '', shopifyStoreUrl: '',
            shopifyAccessToken: '', wooStoreUrl: '', wooConsumerKey: '', wooConsumerSecret: '',
          },
          offline: {
            offlineModeEnabled: false, posOfflineTtlHours: 8,
            maxQueueSize: 100, autoSyncOnReconnect: true, conflictStrategy: 'SERVER_WINS',
          },
          pos: {
            allowNegativeStock: false, thermalPrint80mm: true, fiscalPrint70mm: false,
            boxMode: 'SHARED', defaultPriceType: 'minorista',
            requireInternalCode: false, requireBarcode: false, requireBrand: false,
            requireDescription: false, requireShippingDimensions: false,
            officialDollarQuote: 1000, blueDollarQuote: 1200,
          },
          arca: {
            enabled: false, pointOfSale: 1, environment: 'homologation',
            startDate: '', iibb: '', cuit: '', certAlias: '',
          },
          storefront: {
            enabled: false, primaryColor: '#3b82f6', fontFamily: 'Inter',
            showHeader: true, showStoreName: true, imagesCarousel: [],
            priceListToShow: 'minorista', defaultSort: 'name_asc',
            hideOutOfStock: false, hideBrandFilters: false,
            transferCbu: '', acceptCash: false, shippingInfo: '',
            requireShippingData: 'optional', whatsapp: '',
            instagramUrl: '', facebookUrl: '', tiktokUrl: '', youtubeUrl: '', xUrl: '',
          },
          pwa: {
            appName: 'Mi Empresa', appShortName: 'Empresa',
            themeColor: '#3b82f6', backgroundColor: '#ffffff', iconUrl: '',
          },
          qr: { mpStoreName: 'Mi Comercio', qrGenerated: false },
        },
      });
    }
  }
}
