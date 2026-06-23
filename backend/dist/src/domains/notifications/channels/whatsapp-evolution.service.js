"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WhatsAppEvolutionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppEvolutionService = void 0;
const common_1 = require("@nestjs/common");
let WhatsAppEvolutionService = WhatsAppEvolutionService_1 = class WhatsAppEvolutionService {
    constructor() {
        this.logger = new common_1.Logger(WhatsAppEvolutionService_1.name);
        this.baseUrl = process.env.EVOLUTION_API_URL ?? 'http://localhost:8080';
        this.apiKey = process.env.EVOLUTION_API_KEY ?? 'mock-key';
        this.instance = process.env.EVOLUTION_INSTANCE ?? 'store-main';
    }
    async sendText(phone, message) {
        const endpoint = `${this.baseUrl}/message/sendText/${this.instance}`;
        try {
            if (this.baseUrl === 'http://localhost:8080' && this.apiKey === 'mock-key') {
                this.logger.log(`[WhatsApp Mock] → +${phone}\n` +
                    `  Message: "${message}"`);
                return { success: true };
            }
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.apiKey,
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
        if (this.baseUrl === 'http://localhost:8080' && this.apiKey === 'mock-key') {
            return { isReady: true, qrCode: null };
        }
        const endpoint = `${this.baseUrl}/instance/connectionState/${this.instance}`;
        try {
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'apikey': this.apiKey,
                },
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
    (0, common_1.Injectable)()
], WhatsAppEvolutionService);
//# sourceMappingURL=whatsapp-evolution.service.js.map