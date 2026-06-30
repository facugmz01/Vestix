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
var WhatsAppEvolutionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppEvolutionService = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("../../../modules/settings/settings.service");
let WhatsAppEvolutionService = WhatsAppEvolutionService_1 = class WhatsAppEvolutionService {
    constructor(settingsService) {
        this.settingsService = settingsService;
        this.logger = new common_1.Logger(WhatsAppEvolutionService_1.name);
    }
    async getConfig() {
        const n = await this.settingsService.getNotificationSettings();
        return {
            baseUrl: n.evolutionApiUrl || '',
            apiKey: n.evolutionApiKey || '',
            instance: n.evolutionInstance || 'store-main',
        };
    }
    async sendText(phone, message) {
        const { baseUrl, apiKey, instance } = await this.getConfig();
        if (!baseUrl || !apiKey) {
            this.logger.warn(`[WhatsApp] Cannot send message to ${phone}. Evolution API URL/Key not configured.`);
            return { success: false, error: 'Evolution API not configured' };
        }
        const endpoint = `${baseUrl.replace(/\/+$/, '')}/message/sendText/${instance}`;
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey,
                },
                body: JSON.stringify({
                    number: phone,
                    textMessage: { text: message },
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Evolution API responded with status ${response.status}: ${errorText}`);
            }
            this.logger.log(`[WhatsApp] ✓ Message sent successfully to +${phone}`);
            return { success: true };
        }
        catch (err) {
            this.logger.error(`[WhatsApp] Failed to send to ${phone}: ${err.message}`);
            throw new common_1.InternalServerErrorException(`WhatsApp delivery failed: ${err.message}`);
        }
    }
    async getStatus() {
        const { baseUrl, apiKey, instance } = await this.getConfig();
        if (!baseUrl || !apiKey) {
            return { isReady: false, qrCode: null };
        }
        const endpoint = `${baseUrl.replace(/\/+$/, '')}/instance/connectionState/${instance}`;
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: { 'apikey': apiKey },
            });
            if (!response.ok) {
                return { isReady: false, qrCode: null };
            }
            const data = await response.json();
            const isReady = data?.instance?.state === 'open';
            return { isReady, qrCode: null };
        }
        catch (err) {
            this.logger.error(`[WhatsApp] Failed to fetch connection status: ${err.message}`);
            return { isReady: false, qrCode: null };
        }
    }
};
exports.WhatsAppEvolutionService = WhatsAppEvolutionService;
exports.WhatsAppEvolutionService = WhatsAppEvolutionService = WhatsAppEvolutionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], WhatsAppEvolutionService);
//# sourceMappingURL=whatsapp-evolution.service.js.map