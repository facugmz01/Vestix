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
var MercadoPagoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoPagoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const settings_service_1 = require("../../modules/settings/settings.service");
let MercadoPagoService = MercadoPagoService_1 = class MercadoPagoService {
    constructor(prisma, settingsService) {
        this.prisma = prisma;
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(MercadoPagoService_1.name);
    }
    async getAccessToken() {
        const intSettings = await this.settingsService.getIntegrationSettings();
        return intSettings.mpAccessToken || process.env.MP_ACCESS_TOKEN || '';
    }
    async createPreference(dto) {
        const accessToken = await this.getAccessToken();
        const isMock = !accessToken || accessToken === '';
        const storeUrl = process.env.MP_STORE_URL || 'http://localhost:5173/store';
        if (isMock) {
            this.logger.log(`[MercadoPago Mock] Preference requested:\n` +
                `  Reference: ${dto.externalReference}\n` +
                `  Items: ${dto.items.map(i => `${i.title} x${i.quantity}`).join(', ')}\n` +
                `  Total: $${dto.items.reduce((s, i) => s + i.unit_price * i.quantity, 0) + (dto.shippingCost || 0)}`);
            return {
                preferenceId: `MOCK-${dto.externalReference}`,
                initPoint: `${storeUrl}/checkout-success?orderId=${dto.externalReference}&mock=true`,
            };
        }
        const payload = {
            external_reference: dto.externalReference,
            items: dto.items.map(item => ({
                id: item.id,
                title: item.title,
                quantity: item.quantity,
                unit_price: item.unit_price,
                currency_id: item.currency_id || 'ARS',
            })),
            back_urls: {
                success: dto.backUrls?.success || `${storeUrl}/checkout/success`,
                failure: dto.backUrls?.failure || `${storeUrl}/checkout/failure`,
                pending: dto.backUrls?.pending || `${storeUrl}/checkout/pending`,
            },
            auto_return: 'approved',
            notification_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/storefront/webhooks/mercadopago`,
        };
        if (dto.payer) {
            payload.payer = dto.payer;
        }
        if (dto.shippingCost && dto.shippingCost > 0) {
            payload.items.push({
                id: 'SHIPPING',
                title: 'Costo de envío',
                quantity: 1,
                unit_price: dto.shippingCost,
                currency_id: 'ARS',
            });
        }
        try {
            const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`MercadoPago API error ${response.status}: ${error}`);
            }
            const preference = await response.json();
            this.logger.log(`[MercadoPago] ✓ Preference created: ${preference.id}`);
            const initPoint = process.env.NODE_ENV === 'production'
                ? preference.init_point
                : preference.sandbox_init_point;
            return {
                preferenceId: preference.id,
                initPoint,
            };
        }
        catch (err) {
            this.logger.error(`[MercadoPago] Failed to create preference: ${err.message}`);
            throw new common_1.InternalServerErrorException(`No se pudo crear la preferencia de pago: ${err.message}`);
        }
    }
};
exports.MercadoPagoService = MercadoPagoService;
exports.MercadoPagoService = MercadoPagoService = MercadoPagoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settings_service_1.SettingsService])
], MercadoPagoService);
//# sourceMappingURL=mercadopago.service.js.map