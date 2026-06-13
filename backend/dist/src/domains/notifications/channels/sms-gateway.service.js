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
var SmsGatewayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsGatewayService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const prisma_service_1 = require("../../../core/prisma/prisma.service");
let SmsGatewayService = SmsGatewayService_1 = class SmsGatewayService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SmsGatewayService_1.name);
    }
    async sendSms(phone, message) {
        const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
        const notificationsConfig = settings?.notifications || {};
        const url = notificationsConfig.smsGatewayUrl;
        if (!url) {
            this.logger.warn(`[SMS Gateway] Cannot send SMS to +${phone}. No URL configured.`);
            return { success: false, error: 'No SMS Gateway URL configured' };
        }
        try {
            this.logger.log(`[SMS Gateway] Sending SMS to +${phone} via ${url}...`);
            await axios_1.default.post(url, {
                to: phone,
                message,
            }, { timeout: 10000 });
            this.logger.log(`[SMS Gateway] ✓ SMS successfully handed off to gateway (+${phone}).`);
            return { success: true };
        }
        catch (err) {
            this.logger.error(`[SMS Gateway] Failed to send SMS to +${phone}: ${err.message}`);
            throw err;
        }
    }
};
exports.SmsGatewayService = SmsGatewayService;
exports.SmsGatewayService = SmsGatewayService = SmsGatewayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SmsGatewayService);
//# sourceMappingURL=sms-gateway.service.js.map