"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const audit_log_model_1 = require("../audit/models/audit-log.model");
let SettingsService = SettingsService_1 = class SettingsService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.logger = new common_1.Logger(SettingsService_1.name);
        this.cachedSettings = null;
    }
    async onModuleInit() {
        await this.loadSettingsFromDb();
    }
    async loadSettingsFromDb() {
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
    async reloadSettings() {
        await this.loadSettingsFromDb();
    }
    async updateSection(section, payload, userId) {
        const current = await this.getSettings();
        const previousValue = current[section];
        const updatedSection = { ...previousValue, ...payload };
        const result = await this.prisma.systemSettings.update({
            where: { id: 'default' },
            data: {
                [section]: updatedSection,
            },
        });
        const newValue = result[section];
        if (section === 'general') {
            const g = newValue;
            await this.prisma.storeSettings.updateMany({
                where: { id: 'default' },
                data: {
                    storeName: g.companyName || undefined,
                },
            });
            const branch = await this.prisma.branch.findFirst({ where: { code: 'CENTRAL' } });
            if (branch) {
                const currentBranchSettings = branch.settings || {};
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
        this.cachedSettings[section] = newValue;
        await this.auditService.log({
            userId,
            action: audit_log_model_1.AuditAction.UPDATE,
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
        return {
            success: true,
            message: 'Conexión con AFIP establecida correctamente (Entorno simulado)'
        };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map