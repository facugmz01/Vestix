import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/models/audit-log.model';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  // In-memory cache for fast reads
  private cachedSettings: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.loadSettingsFromDb();
  }

  private async loadSettingsFromDb() {
    let row = await this.prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });

    if (!row) {
      this.logger.log('No SystemSettings found. Creating default singleton...');
      row = await this.prisma.systemSettings.create({
        data: {
          id: 'default',
          general: {
            companyName: 'Mi Empresa',
            legalName: 'Mi Empresa SRL',
            taxId: '30-00000000-0',
            address: '',
            phone: '',
            email: '',
            timezone: 'America/Argentina/Buenos_Aires',
            locale: 'es-AR',
            currency: 'ARS',
          },
          pricing: {
            defaultPriceListId: 'retail-default',
            vatDefaultPct: 0.21,
            allowManualDiscount: true,
            maxDiscountPct: 100,
            roundingRule: 'NONE',
            showPricesWithTax: true,
          },
          skuBarcode: {
            skuPrefix: 'SKU',
            skuAutoGenerate: true,
            barcodeFormat: 'EAN13',
            barcodeAutoGenerate: true,
            nextSkuSequence: 1,
          },
          invoicing: {
            fiscalPointSale: 1,
            afipEnvironment: 'homologation',
            defaultInvoiceType: 'FACTURA_B',
            autoIssueOnSale: false,
            invoiceFooterText: '',
          },
          notifications: {
            emailEnabled: false,
            smsEnabled: false,
            whatsappEnabled: false,
            pushEnabled: false,
            lowStockThreshold: 5,
            notifyOnSale: false,
            notifyOnPurchase: false,
            notifyOnLowStock: true,
            notifyOnTransfer: false,
          },
          integrations: {
            mercadopagoEnabled: false,
            mercadolibreEnabled: false,
            woocommerceEnabled: false,
            shopifyEnabled: false,
          },
          offline: {
            offlineModeEnabled: false,
            posOfflineTtlHours: 8,
            maxQueueSize: 100,
            autoSyncOnReconnect: true,
            conflictStrategy: 'SERVER_WINS',
          },
        },
      });
    }

    this.cachedSettings = {
      general: row.general,
      pricing: row.pricing,
      skuBarcode: row.skuBarcode,
      invoicing: row.invoicing,
      notifications: row.notifications,
      integrations: row.integrations,
      offline: row.offline,
    };
    this.logger.log('SystemSettings loaded from DB');
  }

  async getSettings() {
    if (!this.cachedSettings) {
      await this.loadSettingsFromDb();
    }
    return this.cachedSettings;
  }

  async updateSection(section: string, payload: any, userId: string) {
    const current = await this.getSettings();
    const previousValue = current[section];
    const newValue = { ...previousValue, ...payload };

    await this.prisma.systemSettings.update({
      where: { id: 'default' },
      data: {
        [section]: newValue,
      },
    });

    // Update cache
    this.cachedSettings[section] = newValue;

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      resource: 'SystemSettings',
      resourceId: section,
      module: 'SettingsService',
      previousValue,
      newValue,
      description: `Updated settings section: ${section}`,
    });

    return newValue;
  }
}
