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
var MercadoLibreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MercadoLibreService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const settings_service_1 = require("../../modules/settings/settings.service");
let MercadoLibreService = MercadoLibreService_1 = class MercadoLibreService {
    constructor(prisma, settingsService) {
        this.prisma = prisma;
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(MercadoLibreService_1.name);
    }
    async getSettings() {
        return this.settingsService.getIntegrationSettings();
    }
    async authenticate() {
        const config = await this.getSettings();
        if (!config.mercadolibreEnabled || !config.mlAppId || !config.mlSecretKey) {
            throw new Error('Mercado Libre no está configurado o habilitado');
        }
        this.logger.log(`Authenticating with ML App ID: ${config.mlAppId}`);
        return 'mock-ml-access-token';
    }
    async syncProducts() {
        this.logger.log('Iniciando sincronización de catálogo hacia Mercado Libre...');
        const token = await this.authenticate();
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.logger.log('Sincronización de catálogo finalizada con éxito.');
        return { success: true };
    }
    async handleWebhook(topic, resource) {
        this.logger.log(`[ML Webhook] Recibido topic: ${topic} para resource: ${resource}`);
        return { success: true };
    }
};
exports.MercadoLibreService = MercadoLibreService;
exports.MercadoLibreService = MercadoLibreService = MercadoLibreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        settings_service_1.SettingsService])
], MercadoLibreService);
//# sourceMappingURL=mercadolibre.service.js.map