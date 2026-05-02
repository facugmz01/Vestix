import { Injectable, Logger } from '@nestjs/common';
import { SystemSettings } from './models/settings.model';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/models/audit-log.model';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  /**
   * Production defaults — safe out-of-the-box configuration for an Argentinian retailer.
   * In production, this is hydrated from the DB singleton row on module init.
   */
  private settings: SystemSettings = {
    version: 1,
    store: {
      name: 'Mi Tienda',
      legalName: 'Mi Tienda SRL',
      cuit: '30-00000000-0',
      currency: 'ARS',
      timezone: 'America/Argentina/Buenos_Aires',
    },
    sku: {
      prefix: 'TDA',
      includeCategory: true,
      includeBrand: false,
      includeColor: true,
      includeSize: true,
      separator: '-',
      uppercased: true,
    },
    barcode: {
      companyPrefix: '0400000', // GS1 Argentinian prefix (replace with real assigned prefix)
      autoGenerate: true,
    },
    pricing: {
      defaultVatRate: 0.21,          // 21% IVA — standard Argentine rate
      defaultMarginTarget: 0.45,
      allowNegativeMargin: false,
      roundToNearest: 0.5,
      defaultRetailPriceListId: 'retail-default',
    },
    inventory: {
      allowNegativeStock: false,
      defaultReorderPoint: 5,
      reservationTtlMinutes: 15,
    },
    offline: {
      maxOfflineHours: 8,
      requireManagerPinForReturns: true,
      requireManagerPinForDiscounts: true,
    },
    updatedAt: new Date(),
    updatedByUserId: 'system',
  };

  constructor(private readonly auditService: AuditService) {}

  /**
   * READ — any module can call this to respect system-wide configuration.
   * Returns a deep frozen copy to prevent accidental mutation from callers.
   */
  getSettings(): Readonly<SystemSettings> {
    return Object.freeze({ ...this.settings });
  }

  /**
   * PARTIAL UPDATE — merges only the provided sections, preserving unchanged config.
   * Only callable by Super Admin (enforced at controller level via RBAC).
   * Every write is fully audited with a before/after diff.
   */
  async updateSettings(dto: UpdateSettingsDto, userId: string): Promise<SystemSettings> {
    const previous = { ...this.settings };

    this.settings = {
      ...this.settings,
      ...(dto.store && { store: { ...this.settings.store, ...dto.store } }),
      ...(dto.sku && { sku: { ...this.settings.sku, ...dto.sku } }),
      ...(dto.barcode && { barcode: { ...this.settings.barcode, ...dto.barcode } }),
      ...(dto.pricing && { pricing: { ...this.settings.pricing, ...dto.pricing } }),
      ...(dto.inventory && { inventory: { ...this.settings.inventory, ...dto.inventory } }),
      ...(dto.offline && { offline: { ...this.settings.offline, ...dto.offline } }),
      version: this.settings.version + 1,
      updatedAt: new Date(),
      updatedByUserId: userId,
    };

    this.logger.log(`[Settings] Updated to v${this.settings.version} by user ${userId}`);

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resource: 'SystemSettings',
      resourceId: 'singleton',
      module: 'SettingsService',
      previousValue: previous as any,
      newValue: this.settings as any,
      description: `System settings updated to version ${this.settings.version}`,
    });

    return this.settings;
  }

  // ─── TYPED SECTION ACCESSORS (used by other services) ────────────────────

  /** Called by IdentifiersService to determine SKU generation format. */
  getSkuRules() { return this.settings.sku; }

  /** Called by IdentifiersService for GS1 barcode prefix. */
  getBarcodeRules() { return this.settings.barcode; }

  /** Called by PricingService for VAT rate and margin enforcement. */
  getPricingRules() { return this.settings.pricing; }

  /** Called by InventoryService for negative stock enforcement. */
  getInventoryRules() { return this.settings.inventory; }

  /** Called by ReservationsService for TTL. */
  getOfflineRules() { return this.settings.offline; }
}
