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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var StorefrontAuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorefrontAuthController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const notification_model_1 = require("../notifications/models/notification.model");
const storefront_auth_guard_1 = require("./storefront-auth.guard");
const redis_service_1 = require("../../core/redis/redis.service");
let StorefrontAuthController = StorefrontAuthController_1 = class StorefrontAuthController {
    constructor(prisma, jwtService, notificationsService, redisService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.notificationsService = notificationsService;
        this.redisService = redisService;
        this.logger = new common_1.Logger(StorefrontAuthController_1.name);
        this.OTP_EXPIRY_MS = 10 * 60 * 1000;
        this.RESEND_COOLDOWN_MS = 60 * 1000;
        this.MAX_ATTEMPTS = 5;
    }
    async getOtp(phone) {
        const redis = this.redisService.getClient();
        const data = await redis.get(`otp:${phone}`);
        if (!data)
            return null;
        const entry = JSON.parse(data);
        return {
            code: entry.code,
            expiresAt: new Date(entry.expiresAt),
            sentAt: new Date(entry.sentAt),
            attempts: entry.attempts,
        };
    }
    async setOtp(phone, entry) {
        const redis = this.redisService.getClient();
        const ttlSeconds = Math.max(1, Math.ceil((entry.expiresAt.getTime() - Date.now()) / 1000));
        await redis.set(`otp:${phone}`, JSON.stringify(entry), 'EX', ttlSeconds);
    }
    async deleteOtp(phone) {
        const redis = this.redisService.getClient();
        await redis.del(`otp:${phone}`);
    }
    async sendOtp(body) {
        const phone = this.normalizePhone(body.phone);
        if (!phone) {
            throw new common_1.BadRequestException('Número de teléfono inválido.');
        }
        const existing = await this.getOtp(phone);
        if (existing) {
            const secondsSinceSent = (Date.now() - existing.sentAt.getTime()) / 1000;
            if (secondsSinceSent < this.RESEND_COOLDOWN_MS / 1000) {
                const waitSeconds = Math.ceil(this.RESEND_COOLDOWN_MS / 1000 - secondsSinceSent);
                throw new common_1.BadRequestException(`Esperá ${waitSeconds} segundos antes de solicitar un nuevo código.`);
            }
        }
        const code = String(Math.floor(100000 + Math.random() * 900000));
        await this.setOtp(phone, {
            code,
            expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MS),
            sentAt: new Date(),
            attempts: 0,
        });
        await this.notificationsService.enqueue({
            channel: notification_model_1.NotificationChannel.WHATSAPP,
            templateKey: notification_model_1.TemplateKey.OTP_CODE,
            recipient: phone,
            variables: { otpCode: code },
        });
        this.logger.log(`[OTP] Code sent to +${phone}`);
        return { success: true, message: 'Código enviado por WhatsApp.' };
    }
    async verifyOtp(body, res) {
        const phone = this.normalizePhone(body.phone);
        if (!phone || !body.code) {
            throw new common_1.BadRequestException('Teléfono y código son requeridos.');
        }
        const entry = await this.getOtp(phone);
        if (!entry) {
            throw new common_1.UnauthorizedException('No hay código activo para este número. Solicitá uno nuevo.');
        }
        if (new Date() > entry.expiresAt) {
            await this.deleteOtp(phone);
            throw new common_1.UnauthorizedException('El código expiró. Solicitá uno nuevo.');
        }
        entry.attempts += 1;
        if (entry.attempts > this.MAX_ATTEMPTS) {
            await this.deleteOtp(phone);
            throw new common_1.UnauthorizedException('Demasiados intentos fallidos. Solicitá un nuevo código.');
        }
        if (entry.code !== body.code.trim()) {
            await this.setOtp(phone, entry);
            const remaining = this.MAX_ATTEMPTS - entry.attempts;
            throw new common_1.UnauthorizedException(`Código incorrecto. Te quedan ${remaining} intento${remaining !== 1 ? 's' : ''}.`);
        }
        await this.deleteOtp(phone);
        let customer = await this.prisma.customer.findFirst({
            where: { phone },
        });
        if (!customer) {
            customer = await this.prisma.customer.create({
                data: {
                    fullName: `Cliente +${phone}`,
                    phone,
                    type: 'INDIVIDUAL',
                },
            });
            this.logger.log(`[OTP] New customer created: ${customer.id} (phone: +${phone})`);
        }
        const payload = {
            sub: customer.id,
            phone: customer.phone,
            type: 'STOREFRONT_CUSTOMER',
        };
        const token = this.jwtService.sign(payload);
        res.cookie('storefront_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });
        this.logger.log(`[OTP] ✓ Customer ${customer.id} authenticated via WhatsApp OTP`);
        return {
            success: true,
            customer: {
                id: customer.id,
                fullName: customer.fullName,
                phone: customer.phone,
                email: customer.email,
            },
        };
    }
    async getMe(req) {
        const reqUser = req.user;
        const customer = await this.prisma.customer.findUnique({
            where: { id: reqUser.customerId },
            select: { id: true, fullName: true, phone: true, email: true },
        });
        if (!customer) {
            throw new common_1.UnauthorizedException('Cliente no encontrado.');
        }
        return customer;
    }
    async logout(res) {
        res.clearCookie('storefront_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        return { success: true, message: 'Sesión cerrada.' };
    }
    normalizePhone(raw) {
        if (!raw)
            return null;
        const digits = raw.replace(/\D/g, '');
        if (digits.length < 8)
            return null;
        if (digits.startsWith('549') && digits.length >= 12)
            return digits;
        if (digits.startsWith('54') && digits.length >= 11)
            return digits;
        if (digits.startsWith('0') && digits.length >= 10) {
            return '54' + digits.slice(1);
        }
        if (digits.length >= 8 && digits.length <= 11) {
            return '549' + digits;
        }
        return digits;
    }
};
exports.StorefrontAuthController = StorefrontAuthController;
__decorate([
    (0, common_1.Post)('send-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorefrontAuthController.prototype, "sendOtp", null);
__decorate([
    (0, common_1.Post)('verify-otp'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StorefrontAuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(storefront_auth_guard_1.StorefrontAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorefrontAuthController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StorefrontAuthController.prototype, "logout", null);
exports.StorefrontAuthController = StorefrontAuthController = StorefrontAuthController_1 = __decorate([
    (0, common_1.Controller)('storefront/auth'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        notifications_service_1.NotificationsService,
        redis_service_1.RedisService])
], StorefrontAuthController);
//# sourceMappingURL=storefront-auth.controller.js.map