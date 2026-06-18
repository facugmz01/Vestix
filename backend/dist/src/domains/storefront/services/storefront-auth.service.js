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
var StorefrontAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorefrontAuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const redis_service_1 = require("../../../core/redis/redis.service");
const notifications_service_1 = require("../../notifications/notifications.service");
const jwt_1 = require("@nestjs/jwt");
let StorefrontAuthService = StorefrontAuthService_1 = class StorefrontAuthService {
    constructor(prisma, redis, notifications, jwtService) {
        this.prisma = prisma;
        this.redis = redis;
        this.notifications = notifications;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(StorefrontAuthService_1.name);
    }
    async requestOtp(phone) {
        if (!phone)
            throw new common_1.BadRequestException('Phone number is required');
        const cleanPhone = phone.replace(/\D/g, '');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redis.getClient().setex(`storefront_otp_${cleanPhone}`, 300, otp);
        await this.notifications.enqueue({
            channel: 'WHATSAPP',
            templateKey: 'OTP_CODE',
            recipient: cleanPhone,
            variables: {
                code: otp
            }
        });
        this.logger.log(`Requested OTP for ${cleanPhone}`);
        return { success: true, message: 'OTP enviado correctamente' };
    }
    async verifyOtp(phone, code) {
        if (!phone || !code)
            throw new common_1.BadRequestException('Phone and code are required');
        const cleanPhone = phone.replace(/\D/g, '');
        const redisKey = `storefront_otp_${cleanPhone}`;
        const storedOtp = await this.redis.getClient().get(redisKey);
        if (!storedOtp || storedOtp !== code) {
            throw new common_1.BadRequestException('Código inválido o expirado');
        }
        await this.redis.getClient().del(redisKey);
        let customer = await this.prisma.customer.findFirst({
            where: { phone: cleanPhone }
        });
        if (!customer) {
            customer = await this.prisma.customer.create({
                data: {
                    fullName: 'Cliente Web',
                    phone: cleanPhone,
                    type: 'INDIVIDUAL',
                }
            });
            this.logger.log(`Created new customer ${customer.id} for storefront`);
        }
        const token = this.jwtService.sign({
            sub: customer.id,
            phone: customer.phone,
            type: 'CUSTOMER',
        });
        return { success: true, token, customer };
    }
};
exports.StorefrontAuthService = StorefrontAuthService;
exports.StorefrontAuthService = StorefrontAuthService = StorefrontAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService,
        notifications_service_1.NotificationsService,
        jwt_1.JwtService])
], StorefrontAuthService);
//# sourceMappingURL=storefront-auth.service.js.map