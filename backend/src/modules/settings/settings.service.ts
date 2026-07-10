import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/models/audit-log.model';
import { EncryptionService } from '../../core/crypto/encryption.service';
import * as nodemailer from 'nodemailer';
import { UpdateSettingsDto } from './dto/settings.dto';
import {
  DEFAULT_RECEIPT_STYLE,
  ReceiptStyleSettings,
  resolveReceiptStyle,
} from '../../domains/sales/models/receipt-style.model';
import { evaluateAfipConfiguration } from '../../domains/invoicing/afip-config.util';

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
  receiptStyle?: ReceiptStyleSettings;
}

export interface LabelPrintingSettings {
  defaultTemplateId?: string;
  autoGenerateBarcodeOnPrint: boolean;
  defaultOutput: 'PDF' | 'ZPL' | 'BROWSER';
  zplDpi: 203 | 300;
  zplPrinterHost?: string;
  zplPrinterPort?: number;
}

export type NotificationChannelPreference = 'EMAIL' | 'WHATSAPP' | 'SMS';

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
  notifyOnDelivery: boolean;
  saleChannels?: NotificationChannelPreference[];
  purchaseChannels?: NotificationChannelPreference[];
  deliveryChannels?: NotificationChannelPreference[];
  lowStockChannels?: NotificationChannelPreference[];
  transferChannels?: NotificationChannelPreference[];
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
  deliverySettings?: DeliverySettings;
  storeLoginChannels?: NotificationChannelPreference[];
}

export interface DeliverySettings {
  enableGpsTracking: boolean;
  enableGeofence: boolean;
  geofenceRadiusMeters: number;
  requirePhotoOnDelivery: boolean;
  showMapToCustomer: boolean;
  carriers?: {
    andreani?: { enabled: boolean; apiKey?: string; clientId?: string; contract?: string };
    mercadoEnvios?: { enabled: boolean; accessToken?: string; userId?: string };
  };
}

export interface IntegrationSettings {
  mercadopagoEnabled: boolean;
  mercadolibreEnabled: boolean;
  woocommerceEnabled: boolean;
  shopifyEnabled: boolean;
  mpPublicKey?: string;
  mpAccessToken?: string;   // Decrypted at runtime
  mpWebhookSecret?: string; // Decrypted at runtime
  mpEnvironment?: 'test' | 'production';
  mpExternalPosId?: string; // External POS ID for QR hybrid mode
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

  private withNotificationDefaults(notifications: Record<string, any> | null | undefined) {
    if (!notifications) return notifications;
    return {
      ...notifications,
      saleChannels: notifications.saleChannels?.length ? notifications.saleChannels : ['EMAIL', 'WHATSAPP'],
      purchaseChannels: notifications.purchaseChannels?.length ? notifications.purchaseChannels : ['EMAIL'],
      deliveryChannels: notifications.deliveryChannels?.length ? notifications.deliveryChannels : ['WHATSAPP'],
      lowStockChannels: notifications.lowStockChannels?.length ? notifications.lowStockChannels : ['EMAIL'],
      transferChannels: notifications.transferChannels?.length ? notifications.transferChannels : ['EMAIL'],
    };
  }

  private withStorefrontDefaults(
    storefront: Record<string, any> | null | undefined,
    legacyNotifications?: Record<string, any>,
  ) {
    if (!storefront) return storefront;
    const legacyLogin = legacyNotifications?.storeLoginChannels;
    return {
      ...storefront,
      storeLoginChannels: storefront.storeLoginChannels?.length
        ? storefront.storeLoginChannels
        : legacyLogin?.length
          ? legacyLogin
          : ['WHATSAPP'],
    };
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
        ? this.withNotificationDefaults(this.maskSection('notifications', decrypted.notifications as any))
        : decrypted.notifications,
      storefront: decrypted.storefront
        ? this.withStorefrontDefaults(decrypted.storefront, decrypted.notifications)
        : decrypted.storefront,
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
    const pos = (row?.pos as PosSettings) ?? {} as PosSettings;
    return {
      ...pos,
      receiptStyle: resolveReceiptStyle(pos.receiptStyle),
    };
  }

  async getLabelPrintingSettings(): Promise<LabelPrintingSettings> {
    const row = await this.getCachedRaw();
    return {
      autoGenerateBarcodeOnPrint: true,
      defaultOutput: 'PDF',
      zplDpi: 203,
      ...(row?.labelPrinting as LabelPrintingSettings),
    };
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    const row = await this.getCachedRaw();
    const stored = (row?.notifications as NotificationSettings) ?? {} as NotificationSettings;
    return {
      emailEnabled: false,
      smsEnabled: false,
      whatsappEnabled: false,
      pushEnabled: false,
      lowStockThreshold: 5,
      notifyOnSale: false,
      notifyOnPurchase: false,
      notifyOnLowStock: true,
      notifyOnTransfer: false,
      notifyOnDelivery: true,
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      smsGatewayUrl: '',
      evolutionApiUrl: '',
      evolutionApiKey: '',
      evolutionInstance: 'store-main',
      fcmServerKey: '',
      ...stored,
      ...this.withNotificationDefaults(stored),
    };
  }

  async getStorefrontSettings(): Promise<StorefrontSettings> {
    const row = await this.getCachedRaw();
    const stored = (row?.storefront as StorefrontSettings) ?? {} as StorefrontSettings;
    return {
      ...stored,
      ...this.withStorefrontDefaults(stored, row?.notifications as Record<string, any>),
    };
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

      if (section === 'pricing' && sanitized.defaultPriceListId) {
        await this.syncDefaultPriceListFlags(tx, sanitized.defaultPriceListId);
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
                        'integrations', 'offline', 'pos', 'arca', 'storefront', 'pwa', 'qr', 'labelPrinting'] as const;

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

  async setDefaultPriceListId(priceListId: string) {
    await this.prisma.$transaction(async tx => {
      await this.syncDefaultPriceListFlags(tx, priceListId);

      const current = await tx.systemSettings.findUnique({ where: { id: 'default' } });
      const pricing = ((current?.pricing as Record<string, unknown>) ?? {});
      await tx.systemSettings.update({
        where: { id: 'default' },
        data: {
          pricing: { ...pricing, defaultPriceListId: priceListId },
        },
      });
    });
    this.invalidateCache();
  }

  private async syncDefaultPriceListFlags(tx: any, priceListId: string) {
    await tx.priceList.updateMany({ data: { isDefault: false } });
    await tx.priceList.updateMany({
      where: { id: priceListId },
      data: { isDefault: true },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONNECTION TESTS
  // ───────────────────────────────────────────────────────────────────────────

  private unwrapTestDto<T extends Record<string, any>>(dto: T): T {
    if (dto && typeof dto === 'object' && dto.notifications && typeof dto.notifications === 'object') {
      return { ...dto.notifications, recipient: dto.recipient } as T;
    }
    return dto;
  }

  private buildTestResponse(success: boolean, message: string, logs: string[]) {
    return { success, message, logs };
  }

  private logStep(logs: string[], message: string, step?: string) {
    const stepPrefix = step ? `[Paso ${step}] ` : '';
    const entry = `[${new Date().toISOString()}] ${stepPrefix}${message}`;
    logs.push(entry);
    this.logger.log(`[ConnectionTest] ${stepPrefix}${message}`);
    return entry;
  }

  private maskSecret(value?: string | null) {
    if (!value) return '(vacío)';
    if (value === MASK_VALUE) return '(almacenado en configuración)';
    if (value.length <= 4) return '****';
    return `${value.slice(0, 2)}…${value.slice(-2)} (${value.length} chars)`;
  }

  async testAfipConnection() {
    const logs: string[] = [];
    this.logStep(logs, 'Iniciando verificación de configuración AFIP/ARCA…', '1/3');

    const arca = await this.getArcaSettings();
    const status = evaluateAfipConfiguration(arca);

    this.logStep(
      logs,
      `ARCA habilitado: ${status.enabled ? 'sí' : 'no'} | CUIT: ${status.hasCuit ? 'configurado' : 'faltante'} | Certificados: ${status.hasCertificates ? 'presentes' : 'faltantes'}`,
      '2/3',
    );

    if (!status.configured) {
      this.logStep(logs, `Faltante: ${status.missing.join(', ')}`, '3/3');
      return this.buildTestResponse(
        false,
        `AFIP no configurado (${status.missing.join(', ')}). Completá la pestaña ARCA y las variables AFIP_CERT_PATH/AFIP_KEY_PATH.`,
        logs,
      );
    }

    this.logStep(logs, 'Configuración mínima presente. La integración WSFE aún no está implementada.', '3/3');
    return this.buildTestResponse(
      false,
      'AFIP configurado correctamente, pero la integración WSFE aún no está implementada. Las facturas quedarán en estado pendiente/fallido hasta completar el SDK.',
      logs,
    );
  }

  async testSmtpConnection(rawDto: any) {
    const dto = this.unwrapTestDto(rawDto);
    const logs: string[] = [];
    const recipient = dto.recipient?.trim();
    const startedAt = Date.now();

    try {
      this.logStep(logs, 'Iniciando prueba de conexión SMTP', '1/6');
      this.logStep(logs, `Destinatario de prueba: ${recipient || '(no indicado — solo verificación de credenciales)'}`, '1/6');

      if (!dto.smtpHost) {
        this.logStep(logs, 'Abortado: host SMTP no configurado.', '2/6');
        return this.buildTestResponse(false, 'Host SMTP no configurado', logs);
      }

      let smtpPass = dto.smtpPass;
      if (!smtpPass || smtpPass === MASK_VALUE) {
        this.logStep(logs, 'Contraseña no enviada en el formulario. Leyendo valor almacenado…', '2/6');
        const stored = await this.getNotificationSettings();
        smtpPass = stored.smtpPass || '';
        this.logStep(logs, smtpPass ? 'Contraseña recuperada desde configuración guardada.' : 'No hay contraseña SMTP almacenada.', '2/6');
      } else {
        this.logStep(logs, 'Usando contraseña enviada desde el formulario.', '2/6');
      }

      const port = Number(dto.smtpPort) || 587;
      const secure = port === 465;
      this.logStep(
        logs,
        `Parámetros: host=${dto.smtpHost}, puerto=${port}, TLS/SSL=${secure ? 'sí' : 'no'}, usuario=${dto.smtpUser || '(sin usuario)'}, pass=${this.maskSecret(smtpPass)}`,
        '3/6',
      );

      this.logStep(logs, 'Creando transporte nodemailer…', '4/6');
      const transporter = nodemailer.createTransport({
        host: dto.smtpHost,
        port,
        secure,
        auth: {
          user: dto.smtpUser,
          pass: smtpPass,
        },
      });

      this.logStep(logs, 'Verificando conexión y credenciales (comando VERIFY)…', '5/6');
      await transporter.verify();
      this.logStep(logs, 'VERIFY exitoso: el servidor SMTP aceptó la conexión y autenticación.', '5/6');

      if (recipient) {
        this.logStep(logs, `Enviando correo de prueba a ${recipient}…`, '6/6');
        const info = await transporter.sendMail({
          from: dto.smtpUser ? `"Vestix ERP" <${dto.smtpUser}>` : undefined,
          to: recipient,
          subject: 'Prueba de conexión SMTP — Vestix ERP',
          text: 'Este es un mensaje de prueba enviado desde la configuración de notificaciones de Vestix ERP.',
          html: '<p>Este es un <strong>mensaje de prueba</strong> enviado desde la configuración de notificaciones de Vestix ERP.</p>',
        });
        this.logStep(logs, `Correo aceptado por el servidor. Message-ID: ${info.messageId || 'n/d'}`, '6/6');
        if (info.response) this.logStep(logs, `Respuesta SMTP: ${info.response}`, '6/6');
        this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — ÉXITO`, '6/6');
        return this.buildTestResponse(
          true,
          `Conexión SMTP exitosa. Correo de prueba enviado a ${recipient}.`,
          logs,
        );
      }

      this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — ÉXITO (sin envío)`, '6/6');
      return this.buildTestResponse(
        true,
        'Conexión SMTP exitosa. Credenciales válidas.',
        logs,
      );
    } catch (error: any) {
      this.logger.error(`Error SMTP: ${error.message}`);
      this.logStep(logs, `Error SMTP: ${error.message}`, 'ERROR');
      if (error.code) this.logStep(logs, `Código de error: ${error.code}`, 'ERROR');
      if (error.response) this.logStep(logs, `Respuesta del servidor: ${error.response}`, 'ERROR');
      this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — FALLO`, 'ERROR');
      return this.buildTestResponse(false, `Error SMTP: ${error.message}`, logs);
    }
  }

  async testSmsConnection(rawDto: any) {
    const dto = this.unwrapTestDto(rawDto);
    const logs: string[] = [];
    const recipient = dto.recipient?.trim();
    const startedAt = Date.now();

    try {
      this.logStep(logs, 'Iniciando prueba de SMS Gateway', '1/5');
      this.logStep(logs, `Destinatario de prueba: ${recipient || '(no indicado — solo ping al gateway)'}`, '1/5');
      if (!dto.smsGatewayUrl) {
        this.logStep(logs, 'Abortado: URL del gateway no configurada.', '2/5');
        return this.buildTestResponse(false, 'URL del Gateway SMS no configurada', logs);
      }

      this.logStep(logs, `Gateway configurado: ${dto.smsGatewayUrl}`, '2/5');
      this.logStep(logs, 'Enviando HEAD para verificar disponibilidad…', '3/5');
      const res = await fetch(dto.smsGatewayUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) }).catch(() => null);
      if (res && res.ok) {
        this.logStep(logs, `HEAD OK — HTTP ${res.status} ${res.statusText || ''}`.trim(), '3/5');
      } else {
        this.logStep(logs, `HEAD no respondió OK (status: ${res?.status ?? 'sin respuesta'}).`, '3/5');
      }

      if (recipient) {
        const payload = { to: recipient, message: 'Prueba de conexión SMS — Vestix ERP' };
        this.logStep(logs, `POST ${dto.smsGatewayUrl}`, '4/5');
        this.logStep(logs, `Payload: ${JSON.stringify(payload)}`, '4/5');
        const sendRes = await fetch(dto.smsGatewayUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        const bodyText = await sendRes.text().catch(() => '');
        this.logStep(logs, `Respuesta HTTP ${sendRes.status} ${sendRes.statusText || ''}`.trim(), '5/5');
        if (bodyText) this.logStep(logs, `Cuerpo: ${bodyText.slice(0, 500)}`, '5/5');

        if (!sendRes.ok) {
          this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — FALLO`, '5/5');
          return this.buildTestResponse(false, `El gateway respondió con error HTTP ${sendRes.status}.`, logs);
        }

        this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — ÉXITO`, '5/5');
        return this.buildTestResponse(true, `SMS de prueba enviado a ${recipient}. Verificá el dispositivo.`, logs);
      }

      this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — ${res && res.ok ? 'ÉXITO' : 'PARCIAL'}`, '5/5');
      if (res && res.ok) {
        return this.buildTestResponse(true, 'Conexión SMS Gateway exitosa.', logs);
      }

      return this.buildTestResponse(true, 'Ping enviado. Verificá en el dispositivo si recibió la petición.', logs);
    } catch (error: any) {
      this.logStep(logs, `Error: ${error.message}`, 'ERROR');
      this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — FALLO`, 'ERROR');
      return this.buildTestResponse(false, `Fallo de conexión HTTP: ${error.message}`, logs);
    }
  }

  async testWhatsappConnection(rawDto: any) {
    const dto = this.unwrapTestDto(rawDto);
    const logs: string[] = [];
    const recipient = dto.recipient?.replace(/\D/g, '');
    const startedAt = Date.now();

    try {
      this.logStep(logs, 'Iniciando prueba Evolution API (WhatsApp)', '1/7');
      this.logStep(logs, `Destinatario de prueba: ${recipient ? `+${recipient}` : '(no indicado — solo estado de sesión)'}`, '1/7');
      const url = dto.evolutionApiUrl;
      if (!url) {
        this.logStep(logs, 'Abortado: URL de Evolution API no configurada.', '2/7');
        return this.buildTestResponse(false, 'URL de Evolution API no configurada', logs);
      }

      let apiKey = dto.evolutionApiKey;
      if (!apiKey || apiKey === MASK_VALUE) {
        this.logStep(logs, 'API Key no enviada. Leyendo valor almacenado…', '2/7');
        const stored = await this.getNotificationSettings();
        apiKey = stored.evolutionApiKey || '';
        this.logStep(logs, apiKey ? 'API Key recuperada desde configuración.' : 'No hay API Key almacenada.', '2/7');
      } else {
        this.logStep(logs, 'Usando API Key enviada desde el formulario.', '2/7');
      }
      if (!apiKey) {
        this.logStep(logs, 'Abortado: API Key no configurada.', '2/7');
        return this.buildTestResponse(false, 'API Key de Evolution no configurada', logs);
      }

      const instance = dto.evolutionInstance || 'store-main';
      const endpoint = `${url.replace(/\/+$/, '')}/instance/connectionState/${instance}`;
      this.logStep(logs, `Instancia: ${instance}`, '3/7');
      this.logStep(logs, `GET ${endpoint}`, '4/7');
      this.logStep(logs, `API Key: ${this.maskSecret(apiKey)}`, '4/7');

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(8000),
      }).catch(() => null);

      if (!res || !res.ok) {
        this.logStep(logs, `Evolution API no responde. HTTP ${res?.status ?? 'sin respuesta'}`, '5/7');
        this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — FALLO`, '5/7');
        return this.buildTestResponse(
          false,
          `Evolution API no responde. Status: ${res?.status ?? 'sin respuesta'}. Revisá la URL y API Key.`,
          logs,
        );
      }

      const data = await res.json().catch(() => ({})) as any;
      const state = data?.instance?.state ?? data?.state ?? 'desconocido';
      const isReady = state === 'open';
      this.logStep(logs, `Respuesta HTTP ${res.status}. Estado de sesión: ${state}${isReady ? ' (conectada)' : ' (no conectada)'}`, '5/7');
      if (data) this.logStep(logs, `JSON: ${JSON.stringify(data).slice(0, 400)}`, '5/7');

      if (recipient) {
        if (!isReady) {
          this.logStep(logs, 'No se puede enviar: la sesión WhatsApp no está conectada.', '6/7');
          this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — FALLO`, '6/7');
          return this.buildTestResponse(
            false,
            'Evolution API alcanzable, pero la sesión no está conectada. Escaneá el QR antes de enviar.',
            logs,
          );
        }

        const sendEndpoint = `${url.replace(/\/+$/, '')}/message/sendText/${instance}`;
        const payload = { number: recipient, text: 'Prueba de conexión WhatsApp — Vestix ERP' };
        this.logStep(logs, `POST ${sendEndpoint}`, '6/7');
        this.logStep(logs, `Payload: ${JSON.stringify(payload)}`, '6/7');
        const sendRes = await fetch(sendEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: apiKey },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        const sendBody = await sendRes.text().catch(() => '');
        this.logStep(logs, `Respuesta HTTP ${sendRes.status}`, '7/7');
        if (sendBody) this.logStep(logs, `Cuerpo: ${sendBody.slice(0, 500)}`, '7/7');

        if (!sendRes.ok) {
          this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — FALLO`, '7/7');
          return this.buildTestResponse(false, `Evolution API rechazó el envío (HTTP ${sendRes.status}).`, logs);
        }

        this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — ÉXITO`, '7/7');
        return this.buildTestResponse(true, `WhatsApp de prueba enviado a +${recipient}.`, logs);
      }

      this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — ${isReady ? 'ÉXITO' : 'PARCIAL'}`, '7/7');
      return this.buildTestResponse(
        true,
        isReady
          ? 'Evolution API conectada y sesión activa ✓'
          : 'Evolution API alcanzable, pero la sesión no está conectada (escaneá el QR en el Manager).',
        logs,
      );
    } catch (error: any) {
      this.logStep(logs, `Error: ${error.message}`, 'ERROR');
      this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — FALLO`, 'ERROR');
      return this.buildTestResponse(false, `Fallo al conectar con Evolution API: ${error.message}`, logs);
    }
  }

  async testPushConnection(rawDto: any) {
    const dto = this.unwrapTestDto(rawDto);
    const logs: string[] = [];
    const recipient = dto.recipient?.trim();
    const startedAt = Date.now();

    try {
      this.logStep(logs, 'Iniciando prueba FCM Push', '1/5');
      this.logStep(logs, `Destinatario de prueba: ${recipient ? `token …${recipient.slice(-8)}` : '(no indicado — validación de Server Key)'}`, '1/5');

      let fcmServerKey = dto.fcmServerKey;
      if (!fcmServerKey || fcmServerKey === MASK_VALUE) {
        this.logStep(logs, 'Server Key no enviada. Leyendo valor almacenado…', '2/5');
        const stored = await this.getNotificationSettings();
        fcmServerKey = stored.fcmServerKey || '';
        this.logStep(logs, fcmServerKey ? 'Server Key recuperada desde configuración.' : 'No hay Server Key almacenada.', '2/5');
      } else {
        this.logStep(logs, 'Usando Server Key enviada desde el formulario.', '2/5');
      }
      if (!fcmServerKey) {
        this.logStep(logs, 'Abortado: Server Key de FCM no configurada.', '2/5');
        return this.buildTestResponse(false, 'Server Key de FCM no configurada', logs);
      }

      const token = recipient || 'test-token';
      const payload = {
        to: token,
        notification: {
          title: 'Prueba Vestix ERP',
          body: 'Notificación de prueba desde configuración de notificaciones.',
        },
      };
      this.logStep(logs, `Server Key: ${this.maskSecret(fcmServerKey)}`, '3/5');
      this.logStep(logs, 'POST https://fcm.googleapis.com/fcm/send', '4/5');
      this.logStep(logs, `Payload: ${JSON.stringify({ ...payload, to: recipient ? `…${token.slice(-8)}` : token })}`, '4/5');

      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: { Authorization: `key=${fcmServerKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });

      const result = await res.json().catch(() => ({})) as any;
      this.logStep(logs, `Respuesta HTTP ${res.status}`, '5/5');
      if (result && Object.keys(result).length > 0) {
        this.logStep(logs, `JSON: ${JSON.stringify(result).slice(0, 500)}`, '5/5');
      }

      if (res.status === 401) {
        this.logStep(logs, 'Server Key inválida o rechazada por Google.', '5/5');
        this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — FALLO`, '5/5');
        return this.buildTestResponse(false, 'FCM Server Key inválida.', logs);
      }

      if (recipient) {
        if (!res.ok || result.failure > 0) {
          const errMsg = result.results?.[0]?.error || `FCM HTTP ${res.status}`;
          this.logStep(logs, `Error de entrega: ${errMsg}`, '5/5');
          this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — FALLO`, '5/5');
          return this.buildTestResponse(false, `FCM delivery failed: ${errMsg}`, logs);
        }

        this.logStep(logs, 'Notificación push entregada correctamente.', '5/5');
        this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — ÉXITO`, '5/5');
        return this.buildTestResponse(true, 'Notificación push de prueba enviada correctamente.', logs);
      }

      this.logStep(logs, 'Credenciales FCM validadas correctamente.', '5/5');
      this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — ÉXITO`, '5/5');
      return this.buildTestResponse(true, 'Credenciales FCM validadas correctamente.', logs);
    } catch (error: any) {
      this.logStep(logs, `Error: ${error.message}`, 'ERROR');
      this.logStep(logs, `Prueba finalizada en ${Date.now() - startedAt}ms — FALLO`, 'ERROR');
      return this.buildTestResponse(false, `Error FCM: ${error.message}`, logs);
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
            defaultPriceListId: '', vatDefaultPct: 21,
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
            notifyOnLowStock: true, notifyOnTransfer: false, notifyOnDelivery: true,
            saleChannels: ['EMAIL', 'WHATSAPP'],
            purchaseChannels: ['EMAIL'],
            deliveryChannels: ['WHATSAPP'],
            lowStockChannels: ['EMAIL'],
            transferChannels: ['EMAIL'],
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
            receiptStyle: { ...DEFAULT_RECEIPT_STYLE } as any,
          },
          arca: {
            enabled: false, pointOfSale: 1, environment: 'homologation',
            startDate: '', iibb: '', cuit: '', certAlias: '',
          },
          storefront: {
            enabled: false, primaryColor: '#3b82f6', fontFamily: 'Inter',
            showHeader: true, showStoreName: true, imagesCarousel: [],
            priceListToShow: '', defaultSort: 'name_asc',
            hideOutOfStock: false, hideBrandFilters: false,
            transferCbu: '', acceptCash: false, shippingInfo: '',
            requireShippingData: 'optional', whatsapp: '',
            storeLoginChannels: ['WHATSAPP'],
            instagramUrl: '', facebookUrl: '', tiktokUrl: '', youtubeUrl: '', xUrl: '',
            deliverySettings: {
              enableGpsTracking: true,
              enableGeofence: true,
              geofenceRadiusMeters: 150,
              requirePhotoOnDelivery: false,
              showMapToCustomer: true,
              carriers: {
                andreani: { enabled: false, apiKey: '', clientId: '', contract: '' },
                mercadoEnvios: { enabled: false, accessToken: '', userId: '' },
              },
            },
          },
          pwa: {
            appName: 'Mi Empresa', appShortName: 'Empresa',
            themeColor: '#3b82f6', backgroundColor: '#ffffff', iconUrl: '',
          },
          qr: { mpStoreName: 'Mi Comercio', qrGenerated: false },
          labelPrinting: {
            autoGenerateBarcodeOnPrint: true,
            defaultOutput: 'PDF',
            zplDpi: 203,
            zplPrinterHost: '',
            zplPrinterPort: 9100,
          },
        },
      });
    }
  }
}
