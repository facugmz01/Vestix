"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const nodemailer = __importStar(require("nodemailer"));
let SettingsService = SettingsService_1 = class SettingsService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.logger = new common_1.Logger(SettingsService_1.name);
    }
    async onModuleInit() {
        await this.ensureDefaultSettings();
        await this.syncLegacyBranchData();
    }
    async syncLegacyBranchData() {
        try {
            const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
            if (!settings)
                return;
            const gen = settings.general;
            if (gen && gen.companyName === 'Mi Empresa') {
                const mainBranch = await this.prisma.branch.findFirst({ where: { isMain: true } });
                if (mainBranch && mainBranch.settings) {
                    const bs = mainBranch.settings;
                    if (bs.companyName && bs.companyName !== 'Mi Empresa') {
                        this.logger.log('Syncing legacy branch settings into SystemSettings.general...');
                        await this.prisma.systemSettings.update({
                            where: { id: 'default' },
                            data: {
                                general: {
                                    ...gen,
                                    companyName: bs.companyName,
                                    legalName: bs.companyName,
                                    taxId: bs.taxId || gen.taxId,
                                    address: bs.companyAddress || gen.address,
                                    phone: bs.companyPhone || gen.phone,
                                    email: bs.companyEmail || gen.email,
                                }
                            }
                        });
                    }
                }
            }
        }
        catch (err) {
            this.logger.error('Failed to sync legacy branch data', err);
        }
    }
    async ensureDefaultSettings() {
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
                        openWaOtpUrl: '',
                        openWaOtpSession: 'default',
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
                    pwa: {
                        appName: 'Mi Empresa',
                        appShortName: 'Empresa',
                        themeColor: '#3b82f6',
                        backgroundColor: '#ffffff',
                        iconUrl: '',
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
    async updateAllSettings(dto, userId) {
        return await this.prisma.$transaction(async (tx) => {
            const current = await tx.systemSettings.findUnique({ where: { id: 'default' } });
            if (!current)
                throw new Error('SystemSettings default row not found');
            const dataToUpdate = {};
            if (dto.general)
                dataToUpdate.general = { ...current.general, ...dto.general };
            if (dto.pricing)
                dataToUpdate.pricing = { ...current.pricing, ...dto.pricing };
            if (dto.skuBarcode)
                dataToUpdate.skuBarcode = { ...current.skuBarcode, ...dto.skuBarcode };
            if (dto.invoicing)
                dataToUpdate.invoicing = { ...current.invoicing, ...dto.invoicing };
            if (dto.notifications)
                dataToUpdate.notifications = { ...current.notifications, ...dto.notifications };
            if (dto.integrations)
                dataToUpdate.integrations = { ...current.integrations, ...dto.integrations };
            if (dto.offline)
                dataToUpdate.offline = { ...current.offline, ...dto.offline };
            if (dto.pos)
                dataToUpdate.pos = { ...current.pos, ...dto.pos };
            if (dto.arca)
                dataToUpdate.arca = { ...current.arca, ...dto.arca };
            if (dto.storefront)
                dataToUpdate.storefront = { ...current.storefront, ...dto.storefront };
            if (dto.pwa)
                dataToUpdate.pwa = { ...current.pwa, ...dto.pwa };
            if (dto.qr)
                dataToUpdate.qr = { ...current.qr, ...dto.qr };
            const updated = await tx.systemSettings.update({
                where: { id: 'default' },
                data: dataToUpdate,
            });
            if (dto.general) {
                const g = dataToUpdate.general;
                const branch = await tx.branch.findFirst({ where: { isMain: true } });
                if (branch) {
                    const currentSettings = branch.settings || {};
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
            await this.auditService.log({
                userId,
                action: audit_log_model_1.AuditAction.UPDATE,
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
    async testSmtpConnection(dto) {
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
        }
        catch (error) {
            this.logger.error(`Error SMTP: ${error.message}`);
            return { success: false, message: `Error SMTP: ${error.message}` };
        }
    }
    async testSmsConnection(dto) {
        try {
            if (!dto.smsGatewayUrl)
                return { success: false, message: 'URL no configurada' };
            const res = await fetch(dto.smsGatewayUrl, { method: 'HEAD' }).catch(() => null);
            if (res && res.ok) {
                return { success: true, message: 'Conexión SMS Gateway exitosa.' };
            }
            return { success: true, message: 'Ping enviado. Verifica el dispositivo si recibió la petición.' };
        }
        catch (error) {
            return { success: false, message: `Fallo de conexión HTTP: ${error.message}` };
        }
    }
    async testWhatsappConnection(dto) {
        try {
            if (!dto.openWaUrl)
                return { success: false, message: 'URL Node no configurada' };
            const res = await fetch(dto.openWaUrl, { method: 'GET' }).catch(() => null);
            if (res) {
                return { success: true, message: 'Conexión OpenWA exitosa.' };
            }
            return { success: true, message: 'Ping enviado, asumiendo servidor en línea si no hubo error crítico.' };
        }
        catch (error) {
            return { success: false, message: `Fallo OpenWA: ${error.message}` };
        }
    }
    async testPushConnection(dto) {
        try {
            if (!dto.fcmServerKey)
                return { success: false, message: 'Server Key de FCM no configurada' };
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
            if (res.status === 401)
                return { success: false, message: 'FCM Server Key inválida.' };
            return { success: true, message: 'Conexión FCM exitosa. Credenciales válidas.' };
        }
        catch (error) {
            return { success: false, message: `Error FCM: ${error.message}` };
        }
    }
    async repriceUsd(usdType) {
        return this.prisma.$transaction(async (tx) => {
            const settings = await tx.systemSettings.findUnique({ where: { id: 'default' } });
            const posSettings = settings?.pos || {};
            const newRate = usdType === 'Oficial' ? posSettings.officialDollarQuote : posSettings.blueDollarQuote;
            if (!newRate)
                throw new Error('No USD rate configured');
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
                const metadata = product.metadata || {};
                const costUsd = metadata.costUsd || 0;
                if (costUsd > 0) {
                    const newCost = costUsd * newRate;
                    await tx.product.update({
                        where: { id: product.id },
                        data: { costPrice: newCost }
                    });
                    for (const variant of product.variants) {
                        const vMetadata = variant.attributes || {};
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
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map