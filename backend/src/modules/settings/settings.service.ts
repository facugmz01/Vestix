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
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPass: '',
            smsGatewayUrl: '',
            openWaUrl: '',
            openWaSession: 'default',
          },
          integrations: {
            mercadopagoEnabled: false,
            mercadolibreEnabled: false,
            woocommerceEnabled: false,
            shopifyEnabled: false,
            mlAppId: '',
            mlSecretKey: '',
            shopifyStoreUrl: '',
            shopifyAccessToken: '',
            wooStoreUrl: '',
            wooConsumerKey: '',
            wooConsumerSecret: '',
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
    const updatedSection = { ...previousValue, ...payload };

    const result = await this.prisma.systemSettings.update({
      where: { id: 'default' },
      data: {
        [section]: updatedSection,
      },
    });

    const newValue = (result as any)[section];

    // --- Unificación de la Fuente de Verdad ---
    if (section === 'general') {
      const g = newValue as any;
      // 1. Sincronizar con StoreSettings
      await this.prisma.storeSettings.updateMany({
        where: { id: 'default' },
        data: {
          storeName: g.companyName || undefined,
        },
      });

      // 2. Sincronizar con Branch (CENTRAL)
      const branch = await this.prisma.branch.findFirst({ where: { code: 'CENTRAL' } });
      if (branch) {
        const currentBranchSettings = (branch.settings as any) || {};
        await this.prisma.branch.update({
          where: { id: branch.id },
          data: {
            name: g.companyName ? `${g.companyName} - Casa Central` : undefined,
            address: g.address,
            phone: g.phone,
            settings: {
              ...currentBranchSettings,
              taxId: g.taxId || currentBranchSettings.taxId,
              companyName: g.companyName || currentBranchSettings.companyName,
              companyEmail: g.email || currentBranchSettings.companyEmail,
              companyPhone: g.phone || currentBranchSettings.companyPhone,
              companyAddress: g.address || currentBranchSettings.companyAddress,
              posReceiptHeader: g.companyName || currentBranchSettings.posReceiptHeader,
              posReceiptFooter: g.taxId || g.address ? `CUIT: ${g.taxId || ''} | ${g.address || ''}` : currentBranchSettings.posReceiptFooter,
            },
          },
        });
      }
    }

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

  async testAfipConnection() {
    // Mock AFIP connection test
    return {
      success: true,
      message: 'Conexión con AFIP establecida correctamente (Entorno simulado)'
    };
  }
}
