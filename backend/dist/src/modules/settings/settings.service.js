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
const encryption_service_1 = require("../../core/crypto/encryption.service");
const nodemailer = __importStar(require("nodemailer"));
const SENSITIVE_FIELDS = {
    notifications: ['smtpPass', 'evolutionApiKey', 'fcmServerKey'],
    integrations: ['mpAccessToken', 'mpWebhookSecret', 'mlSecretKey', 'wooConsumerSecret', 'shopifyAccessToken'],
};
const CACHE_TTL_MS = 30_000;
let SettingsService = SettingsService_1 = class SettingsService {
    constructor(prisma, auditService, encryption) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.encryption = encryption;
        this.logger = new common_1.Logger(SettingsService_1.name);
        this.cache = null;
    }
    async onModuleInit() {
        await this.ensureDefaultSettings();
    }
    sanitizeSection(obj) {
        return Object.fromEntries(Object.entries(obj).filter(([, v]) => {
            if (v === null || v === undefined)
                return false;
            if (typeof v === 'number' && isNaN(v))
                return false;
            return true;
        }));
    }
    encryptSection(sectionKey, data) {
        const sensitiveKeys = SENSITIVE_FIELDS[sectionKey];
        if (!sensitiveKeys)
            return data;
        const result = { ...data };
        for (const key of sensitiveKeys) {
            if (result[key] && typeof result[key] === 'string' && result[key] !== '') {
                result[key] = this.encryption.encrypt(result[key]);
            }
        }
        return result;
    }
    decryptSection(sectionKey, data) {
        const sensitiveKeys = SENSITIVE_FIELDS[sectionKey];
        if (!sensitiveKeys)
            return data;
        const result = { ...data };
        for (const key of sensitiveKeys) {
            if (result[key] && typeof result[key] === 'string') {
                result[key] = this.encryption.decrypt(result[key]);
            }
        }
        return result;
    }
    maskSection(sectionKey, data) {
        const sensitiveKeys = SENSITIVE_FIELDS[sectionKey];
        if (!sensitiveKeys)
            return data;
        const result = { ...data };
        for (const key of sensitiveKeys) {
            if (result[key]) {
                result[key] = this.encryption.mask(result[key]);
            }
        }
        return result;
    }
    decryptRow(row) {
        return {
            ...row,
            notifications: row.notifications
                ? this.decryptSection('notifications', row.notifications)
                : row.notifications,
            integrations: row.integrations
                ? this.decryptSection('integrations', row.integrations)
                : row.integrations,
        };
    }
    maskForResponse(row) {
        const decrypted = this.decryptRow(row);
        return {
            ...decrypted,
            notifications: decrypted.notifications
                ? this.maskSection('notifications', decrypted.notifications)
                : decrypted.notifications,
            integrations: decrypted.integrations
                ? this.maskSection('integrations', decrypted.integrations)
                : decrypted.integrations,
        };
    }
    invalidateCache() {
        this.cache = null;
    }
    async getCachedRaw() {
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
    async getGeneralSettings() {
        const row = await this.getCachedRaw();
        return row?.general ?? {};
    }
    async getPricingSettings() {
        const row = await this.getCachedRaw();
        return row?.pricing ?? {};
    }
    async getPosSettings() {
        const row = await this.getCachedRaw();
        return row?.pos ?? {};
    }
    async getNotificationSettings() {
        const row = await this.getCachedRaw();
        return row?.notifications ?? {};
    }
    async getStorefrontSettings() {
        const row = await this.getCachedRaw();
        return row?.storefront ?? {};
    }
    async getIntegrationSettings() {
        const row = await this.getCachedRaw();
        return row?.integrations ?? {};
    }
    async getPwaSettings() {
        const row = await this.getCachedRaw();
        return row?.pwa ?? {};
    }
    async getArcaSettings() {
        const row = await this.getCachedRaw();
        return row?.arca ?? {};
    }
    async getOfflineSettings() {
        const row = await this.getCachedRaw();
        return row?.offline ?? {};
    }
    async getSettings() {
        const row = await this.getCachedRaw();
        return this.maskForResponse(row);
    }
    async updateSection(section, dto, userId) {
        return await this.prisma.$transaction(async (tx) => {
            const current = await tx.systemSettings.findUnique({ where: { id: 'default' } });
            if (!current)
                throw new Error('SystemSettings default row not found');
            const currentSection = current[section] ?? {};
            const sanitized = this.sanitizeSection(dto);
            const merged = { ...currentSection, ...sanitized };
            const encrypted = this.encryptSection(section, merged);
            const updated = await tx.systemSettings.update({
                where: { id: 'default' },
                data: { [section]: encrypted },
            });
            if (section === 'general') {
                await this.syncGeneralToBranch(tx, encrypted);
            }
            await this.auditService.log({
                userId,
                action: audit_log_model_1.AuditAction.UPDATE,
                resource: 'SystemSettings',
                resourceId: 'default',
                module: 'SettingsService',
                previousValue: { [section]: currentSection },
                newValue: { [section]: merged },
                description: `Updated settings section: ${section}`,
            });
            this.invalidateCache();
            return this.maskForResponse(updated);
        });
    }
    async updateAllSettings(dto, userId) {
        return await this.prisma.$transaction(async (tx) => {
            const current = await tx.systemSettings.findUnique({ where: { id: 'default' } });
            if (!current)
                throw new Error('SystemSettings default row not found');
            const sections = ['general', 'pricing', 'skuBarcode', 'invoicing', 'notifications',
                'integrations', 'offline', 'pos', 'arca', 'storefront', 'pwa', 'qr'];
            const dataToUpdate = {};
            for (const s of sections) {
                if (dto[s]) {
                    const current_ = current[s] ?? {};
                    const sanitized = this.sanitizeSection(dto[s]);
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
                action: audit_log_model_1.AuditAction.UPDATE,
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
    async syncGeneralToBranch(tx, g) {
        const branch = await tx.branch.findFirst({ where: { isMain: true } });
        if (!branch)
            return;
        const currentSettings = branch.settings ?? {};
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
    async testAfipConnection() {
        return {
            success: false,
            message: 'Prueba de conexión AFIP no disponible aún. Configurá los certificados en la pestaña ARCA.',
        };
    }
    async testSmtpConnection(dto) {
        try {
            if (!dto.smtpHost)
                return { success: false, message: 'Host SMTP no configurado' };
            const transporter = nodemailer.createTransport({
                host: dto.smtpHost,
                port: Number(dto.smtpPort) || 587,
                secure: Number(dto.smtpPort) === 465,
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
                return { success: false, message: 'URL del Gateway SMS no configurada' };
            const res = await fetch(dto.smsGatewayUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) }).catch(() => null);
            if (res && res.ok) {
                return { success: true, message: 'Conexión SMS Gateway exitosa.' };
            }
            return { success: true, message: 'Ping enviado. Verificá en el dispositivo si recibió la petición.' };
        }
        catch (error) {
            return { success: false, message: `Fallo de conexión HTTP: ${error.message}` };
        }
    }
    async testWhatsappConnection(dto) {
        try {
            const url = dto.evolutionApiUrl;
            if (!url)
                return { success: false, message: 'URL de Evolution API no configurada' };
            if (!dto.evolutionApiKey)
                return { success: false, message: 'API Key de Evolution no configurada' };
            const apiKey = dto.evolutionApiKey;
            const instance = dto.evolutionInstance || 'store-main';
            const endpoint = `${url.replace(/\/+$/, '')}/instance/connectionState/${instance}`;
            const res = await fetch(endpoint, {
                method: 'GET',
                headers: { 'apikey': apiKey },
                signal: AbortSignal.timeout(8000),
            }).catch(() => null);
            if (res && res.ok) {
                const data = await res.json().catch(() => ({}));
                const isReady = data?.instance?.state === 'open';
                return {
                    success: true,
                    message: isReady
                        ? 'Evolution API conectada y sesión activa ✓'
                        : 'Evolution API alcanzable, pero la sesión no está conectada (escanea el QR en el Manager).',
                };
            }
            return { success: false, message: `Evolution API no responde. Status: ${res?.status ?? 'sin respuesta'}. Revisá la URL y API Key.` };
        }
        catch (error) {
            return { success: false, message: `Fallo al conectar con Evolution API: ${error.message}` };
        }
    }
    async testPushConnection(dto) {
        try {
            if (!dto.fcmServerKey)
                return { success: false, message: 'Server Key de FCM no configurada' };
            const res = await fetch('https://fcm.googleapis.com/fcm/send', {
                method: 'POST',
                headers: { 'Authorization': `key=${dto.fcmServerKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: 'test-token', notification: { title: 'Test', body: 'Test Push' } }),
                signal: AbortSignal.timeout(8000),
            });
            if (res.status === 401)
                return { success: false, message: 'FCM Server Key inválida.' };
            return { success: true, message: 'Credenciales FCM validadas correctamente.' };
        }
        catch (error) {
            return { success: false, message: `Error FCM: ${error.message}` };
        }
    }
    async repriceUsd(usdType) {
        return this.prisma.$transaction(async (tx) => {
            const posSettings = await this.getPosSettings();
            const newRate = usdType === 'Oficial' ? posSettings.officialDollarQuote : posSettings.blueDollarQuote;
            if (!newRate)
                throw new Error('No USD rate configured');
            const products = await tx.product.findMany({
                where: { metadata: { path: ['usdCurrency'], equals: usdType } },
                include: { variants: true },
            });
            let updatedCount = 0;
            for (const product of products) {
                const metadata = product.metadata || {};
                const costUsd = metadata.costUsd || 0;
                if (costUsd > 0) {
                    await tx.product.update({ where: { id: product.id }, data: { costPrice: costUsd * newRate } });
                    for (const variant of product.variants) {
                        const vMetadata = variant.attributes || {};
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
    async ensureDefaultSettings() {
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
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        encryption_service_1.EncryptionService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map