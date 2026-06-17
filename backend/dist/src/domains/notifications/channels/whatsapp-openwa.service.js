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
var WhatsAppOpenWaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppOpenWaService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../../../core/prisma/prisma.service");
let WhatsAppOpenWaService = WhatsAppOpenWaService_1 = class WhatsAppOpenWaService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WhatsAppOpenWaService_1.name);
    }
    async sendText(phone, message, isOtp = false) {
        const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
        const notificationsConfig = settings?.notifications || {};
        const openWaUrl = isOtp ? (notificationsConfig.openWaOtpUrl || notificationsConfig.openWaUrl) : notificationsConfig.openWaUrl;
        const session = isOtp ? (notificationsConfig.openWaOtpSession || notificationsConfig.openWaSession || 'default') : (notificationsConfig.openWaSession || 'default');
        if (!openWaUrl) {
            this.logger.warn(`[OpenWA] Cannot send message to ${phone}. No URL configured.`);
            return { success: false, error: 'OpenWA URL not configured' };
        }
        try {
            const formattedNumber = phone.includes('@c.us') ? phone : `${phone}@c.us`;
            await axios_1.default.post(`${openWaUrl.replace(/\/+$/, '')}/api/sendText`, {
                session,
                chatId: formattedNumber,
                text: message,
            }, { timeout: 15000 });
            this.logger.log(`[WhatsApp] ✓ Message sent successfully to +${phone} via ${openWaUrl}`);
            return { success: true };
        }
        catch (err) {
            this.logger.error(`[WhatsApp] Failed to send to ${phone}: ${err.message}`);
            throw err;
        }
    }
    async getStatus() {
        const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
        const notificationsConfig = settings?.notifications || {};
        const openWaUrl = notificationsConfig.openWaUrl;
        if (!openWaUrl) {
            return { isReady: false, qrCode: null };
        }
        try {
            const session = notificationsConfig.openWaSession || 'default';
            const res = await axios_1.default.get(`${openWaUrl.replace(/\/+$/, '')}/api/sessions/status/${session}`);
            const isReady = res.data?.state === 'CONNECTED';
            return { isReady, qrCode: null };
        }
        catch (err) {
            return { isReady: false, qrCode: null };
        }
    }
};
exports.WhatsAppOpenWaService = WhatsAppOpenWaService;
exports.WhatsAppOpenWaService = WhatsAppOpenWaService = WhatsAppOpenWaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WhatsAppOpenWaService);
//# sourceMappingURL=whatsapp-openwa.service.js.map