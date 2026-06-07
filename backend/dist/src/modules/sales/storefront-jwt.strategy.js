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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorefrontJwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let StorefrontJwtStrategy = class StorefrontJwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'storefront-jwt') {
    constructor(prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                (request) => {
                    return request?.cookies?.storefront_token || null;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'fallback-secret-for-dev-only',
        });
        this.prisma = prisma;
    }
    async validate(payload) {
        if (payload.type !== 'STOREFRONT_CUSTOMER') {
            throw new common_1.UnauthorizedException('Token de tipo inválido para la tienda.');
        }
        const customer = await this.prisma.customer.findUnique({
            where: { id: payload.sub },
        });
        if (!customer || !customer.isActive) {
            throw new common_1.UnauthorizedException('Sesión de cliente inválida o eliminada.');
        }
        return {
            customerId: customer.id,
            phone: customer.phone,
            fullName: customer.fullName,
            email: customer.email,
        };
    }
};
exports.StorefrontJwtStrategy = StorefrontJwtStrategy;
exports.StorefrontJwtStrategy = StorefrontJwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StorefrontJwtStrategy);
//# sourceMappingURL=storefront-jwt.strategy.js.map