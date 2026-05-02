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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = exports.AuditAction = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "CREATE";
    AuditAction["UPDATE"] = "UPDATE";
    AuditAction["DELETE"] = "DELETE";
    AuditAction["LOGIN"] = "LOGIN";
    AuditAction["LOGOUT"] = "LOGOUT";
    AuditAction["ACCESS_DENIED"] = "ACCESS_DENIED";
    AuditAction["EXPORT"] = "EXPORT";
    AuditAction["RECONCILE"] = "RECONCILE";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
let AuditService = AuditService_1 = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AuditService_1.name);
    }
    async log(payload) {
        const safeNewValue = this.sanitize(payload.newValue);
        const safePreviousValue = this.sanitize(payload.previousValue);
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: payload.userId,
                    userEmail: payload.userEmail,
                    ipAddress: payload.ipAddress,
                    action: payload.action,
                    resource: payload.resource,
                    resourceId: payload.resourceId,
                    previousValue: safePreviousValue ?? undefined,
                    newValue: safeNewValue ?? undefined,
                    module: payload.module,
                    description: payload.description,
                }
            });
        }
        catch (err) {
            this.logger.error(`[AuditService] FAILED to persist audit log: ${err}`);
        }
        this.logger.log(`[Audit] ${payload.action} | ${payload.resource} ${payload.resourceId ?? ''} | User: ${payload.userId}`);
    }
    async getResourceHistory(resource, resourceId) {
        return this.prisma.auditLog.findMany({
            where: { resource, resourceId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getUserTrail(userId, fromDate, toDate) {
        return this.prisma.auditLog.findMany({
            where: {
                userId,
                createdAt: {
                    gte: fromDate,
                    lte: toDate,
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getSecurityEvents(fromDate) {
        const since = fromDate ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
        return this.prisma.auditLog.findMany({
            where: {
                action: AuditAction.ACCESS_DENIED,
                createdAt: { gte: since },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getModuleActivity(module, limit = 100) {
        return this.prisma.auditLog.findMany({
            where: { module },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    sanitize(value) {
        if (!value)
            return undefined;
        const BLOCKED_KEYS = ['password', 'passwordHash', 'token', 'secret', 'cardNumber', 'cvv', 'accessToken'];
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, BLOCKED_KEYS.includes(k) ? '[REDACTED]' : v]));
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map