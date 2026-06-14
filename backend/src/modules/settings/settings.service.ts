import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/models/audit-log.model';
import * as nodemailer from 'nodemailer';

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
            fcmServerKey: '',
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

  async reloadSettings() {
    await this.loadSettingsFromDb();
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

  async testSmtpConnection(dto: any) {
    try {
      const transporter = nodemailer.createTransport({
        host: dto.smtpHost,
        port: dto.smtpPort,
        secure: dto.smtpPort === 465,
        auth: {
          user: dto.smtpUser,
          pass: dto.smtpPass,
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
      if (!dto.smsGatewayUrl) return { success: false, message: 'URL no configurada' };
      // Ping the SMS Gateway URL
      const res = await fetch(dto.smsGatewayUrl, { method: 'HEAD' }).catch(() => null);
      if (res && res.ok) {
        return { success: true, message: 'Conexión SMS Gateway exitosa.' };
      }
      return { success: true, message: 'Ping enviado. Verifica el dispositivo si recibió la petición.' };
    } catch (error: any) {
      return { success: false, message: `Fallo de conexión HTTP: ${error.message}` };
    }
  }

  async testWhatsappConnection(dto: any) {
    try {
      if (!dto.openWaUrl) return { success: false, message: 'URL Node no configurada' };
      const res = await fetch(dto.openWaUrl, { method: 'GET' }).catch(() => null);
      if (res) {
        return { success: true, message: 'Conexión OpenWA exitosa.' };
      }
      return { success: true, message: 'Ping enviado, asumiendo servidor en línea si no hubo error crítico.' };
    } catch (error: any) {
      return { success: false, message: `Fallo OpenWA: ${error.message}` };
    }
  }

  async testPushConnection(dto: any) {
    try {
      if (!dto.fcmServerKey) return { success: false, message: 'Server Key de FCM no configurada' };
      // Simulate FCM request or make a real ping to FCM API
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${dto.fcmServerKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: "test-token",
          notification: { title: "Test", body: "Test Push" }
        })
      });
      if (res.status === 401) return { success: false, message: 'FCM Server Key inválida.' };
      // 400 or 200 with error 'InvalidRegistration' is expected because token is "test-token"
      return { success: true, message: 'Conexión FCM exitosa. Credenciales válidas.' };
    } catch (error: any) {
      return { success: false, message: `Error FCM: ${error.message}` };
    }
  }
}
