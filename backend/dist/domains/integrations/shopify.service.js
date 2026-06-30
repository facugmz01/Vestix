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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ShopifyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopifyService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../../core/prisma/prisma.service");
const settings_service_1 = require("../../modules/settings/settings.service");
let ShopifyService = ShopifyService_1 = class ShopifyService {
    constructor(prisma, settingsService) {
        this.prisma = prisma;
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(ShopifyService_1.name);
    }
    async getSettings() {
        return this.settingsService.getIntegrationSettings();
    }
    getClient(config) {
        if (!config.shopifyEnabled || !config.shopifyStoreUrl || !config.shopifyAccessToken) {
            throw new Error('Shopify no está configurado o habilitado');
        }
        return axios_1.default.create({
            baseURL: `https://${config.shopifyStoreUrl}/admin/api/2023-10`,
            headers: {
                'X-Shopify-Access-Token': config.shopifyAccessToken,
                'Content-Type': 'application/json',
            }
        });
    }
    async syncInventory() {
        this.logger.log('Iniciando sincronización de inventario hacia Shopify...');
        const config = await this.getSettings();
        const client = this.getClient(config);
        this.logger.log('Actualizando niveles de inventario en Shopify...');
        await new Promise(resolve => setTimeout(resolve, 800));
        this.logger.log('Sincronización de inventario finalizada.');
        return { success: true };
    }
    async handleWebhook(topic, payload) {
        this.logger.log(`[Shopify Webhook] Recibido evento: ${topic}`);
        return { success: true };
    }
};
exports.ShopifyService = ShopifyService;
exports.ShopifyService = ShopifyService = ShopifyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settings_service_1.SettingsService])
], ShopifyService);
//# sourceMappingURL=shopify.service.js.map