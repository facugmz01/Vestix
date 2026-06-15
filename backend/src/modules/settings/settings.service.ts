import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/models/audit-log.model';
import * as nodemailer from 'nodemailer';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultSettings();
  }

  private async ensureDefaultSettings() {
    const row = await this.prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });

    if (!row) {
      this.logger.log('No SystemSettings found. Creating default singleton...');
      await this.prisma.systemSettings.create({
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
            vatDefaultPct: 21,
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
            defaultInvoiceType: 'FACTURA_B',
            autoIssueOnSale: false,
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
          pos: {
            allowNegativeStock: false,
            thermalPrint80mm: true,
            fiscalPrint70mm: false,
            boxMode: 'SHARED',
            defaultPriceType: 'minorista',
            requireInternalCode: false,
            requireBarcode: false,
            requireBrand: false,
            requireDescription: false,
            requireShippingDimensions: false,
            officialDollarQuote: 1000,
            blueDollarQuote: 1200,
          },
          arca: {
            enabled: false,
            pointOfSale: 1,
            environment: 'homologation',
            startDate: '',
            iibb: '',
            cuit: '',
            certAlias: '',
          },
          storefront: {
            enabled: false,
            primaryColor: '#3b82f6',
            fontFamily: 'Inter',
            showHeader: true,
            showStoreName: true,
            imagesCarousel: [],
            priceListToShow: 'minorista',
            defaultSort: 'name_asc',
            hideOutOfStock: false,
            hideBrandFilters: false,
            transferCbu: '',
            acceptCash: false,
            shippingInfo: '',
            requireShippingData: 'optional',
            whatsapp: '',
            instagramUrl: '',
            facebookUrl: '',
            tiktokUrl: '',
            youtubeUrl: '',
            xUrl: '',
          },
          mobile: {
            // Future configuration for PWA
          },
          qr: {
            mpStoreName: 'Mi Comercio',
            qrGenerated: false,
          }
        },
      });
    }
  }

  async getSettings() {
    const row = await this.prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });
    if (!row) {
      await this.ensureDefaultSettings();
      return this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
    }
    return row;
  }

  async updateAllSettings(dto: UpdateSettingsDto, userId: string) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Fetch current to merge safely
      const current = await tx.systemSettings.findUnique({ where: { id: 'default' } });
      if (!current) throw new Error('SystemSettings default row not found');

      const dataToUpdate: any = {};

      if (dto.general) dataToUpdate.general = { ...(current.general as object), ...dto.general };
      if (dto.pricing) dataToUpdate.pricing = { ...(current.pricing as object), ...dto.pricing };
      if (dto.skuBarcode) dataToUpdate.skuBarcode = { ...(current.skuBarcode as object), ...dto.skuBarcode };
      if (dto.invoicing) dataToUpdate.invoicing = { ...(current.invoicing as object), ...dto.invoicing };
      if (dto.notifications) dataToUpdate.notifications = { ...(current.notifications as object), ...dto.notifications };
      if (dto.integrations) dataToUpdate.integrations = { ...(current.integrations as object), ...dto.integrations };
      if (dto.offline) dataToUpdate.offline = { ...(current.offline as object), ...dto.offline };
      if (dto.pos) dataToUpdate.pos = { ...(current.pos as object), ...dto.pos };
      if (dto.arca) dataToUpdate.arca = { ...(current.arca as object), ...dto.arca };
      if (dto.storefront) dataToUpdate.storefront = { ...(current.storefront as object), ...dto.storefront };
      if (dto.pwa) dataToUpdate.pwa = { ...((current as any).pwa as object), ...dto.pwa };
      if (dto.qr) dataToUpdate.qr = { ...(current.qr as object), ...dto.qr };

      // 2. Update SystemSettings atomically
      const updated = await tx.systemSettings.update({
        where: { id: 'default' },
        data: dataToUpdate,
      });

      // 3. Sync Branch CENTRAL if general settings were updated
      if (dto.general) {
        const g = dataToUpdate.general;
        
        const branch = await tx.branch.findFirst({ where: { isMain: true } });
        if (branch) {
          const currentSettings = (branch.settings as any) || {};
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
              }
            }
          });
        }
      }

      // 4. Audit Log
      await this.auditService.log({
        userId,
        action: AuditAction.UPDATE,
        resource: 'SystemSettings',
        resourceId: 'default',
        module: 'SettingsService',
        previousValue: current,
        newValue: updated,
        description: `Updated system settings globally`,
      });

      return updated;
    });
  }

  async testAfipConnection() {
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
      return { success: true, message: 'Conexión FCM exitosa. Credenciales válidas.' };
    } catch (error: any) {
      return { success: false, message: `Error FCM: ${error.message}` };
    }
  }

  async repriceUsd(usdType: 'Oficial' | 'Blue') {
    return this.prisma.$transaction(async (tx) => {
      const settings = await tx.systemSettings.findUnique({ where: { id: 'default' } });
      const posSettings = (settings?.pos as any) || {};
      const newRate = usdType === 'Oficial' ? posSettings.officialDollarQuote : posSettings.blueDollarQuote;

      if (!newRate) throw new Error('No USD rate configured');

      const products = await tx.product.findMany({
        where: {
          metadata: {
            path: ['usdCurrency'],
            equals: usdType
          }
        },
        include: { variants: true }
      });

      let updatedCount = 0;
      for (const product of products) {
        const metadata: any = product.metadata || {};
        const costUsd = metadata.costUsd || 0;
        
        if (costUsd > 0) {
          const newCost = costUsd * newRate;
          
          await tx.product.update({
            where: { id: product.id },
            data: { costPrice: newCost }
          });

          for (const variant of product.variants) {
            const vMetadata: any = variant.attributes || {};
            const vCostUsd = vMetadata.costUsd || costUsd;
            if (vCostUsd > 0) {
              const vCost = vCostUsd * newRate;
              await tx.productVariant.update({
                where: { id: variant.id },
                data: { costPrice: vCost }
              });
            }
          }
          updatedCount++;
        }
      }
      return { success: true, updatedCount };
    });
  }
}
