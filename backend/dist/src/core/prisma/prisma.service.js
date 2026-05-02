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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const audit_context_service_1 = require("../audit-context/audit-context.service");
const AUDITED_MODELS = new Set([
    'SaleOrder',
    'SaleOrderVariance',
    'OrderLineItem',
    'Invoice',
    'Customer',
    'User',
    'PurchaseOrder',
    'TreasuryReceipt',
    'InventoryMovement',
    'StockLevel',
]);
const AUDIT_ACTIONS = new Set(['create', 'update', 'delete', 'upsert']);
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor(auditContextService) {
        super();
        this.auditContextService = auditContextService;
    }
    async onModuleInit() {
        await this.$connect();
        this.$use(async (params, next) => {
            const isAudited = AUDIT_ACTIONS.has(params.action) && AUDITED_MODELS.has(params.model ?? '');
            let previousValue;
            if (isAudited && (params.action === 'update' || params.action === 'delete') && params.args?.where) {
                try {
                    const modelClient = this[this.toCamelCase(params.model)];
                    previousValue = await modelClient?.findUnique({ where: params.args.where });
                }
                catch {
                }
            }
            const result = await next(params);
            if (isAudited) {
                const ctx = this.auditContextService.getContext();
                this.auditLog.create({
                    data: {
                        userId: ctx?.userId ?? 'system_auto',
                        userEmail: ctx?.userEmail,
                        ipAddress: ctx?.ipAddress,
                        action: params.action.toUpperCase(),
                        resource: params.model ?? 'Unknown',
                        resourceId: result?.id?.toString() ?? null,
                        previousValue: previousValue ? this.sanitize(previousValue) : undefined,
                        newValue: result ? this.sanitize(result) : undefined,
                        module: 'PRISMA_MIDDLEWARE',
                        description: `${params.model} ${params.action}${ctx?.requestId ? ` [req:${ctx.requestId}]` : ''}`,
                    }
                }).catch(err => {
                    console.error('[PrismaAuditMiddleware] FAILED to persist AuditLog:', err);
                });
            }
            return result;
        });
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    toCamelCase(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }
    sanitize(value) {
        const BLOCKED_KEYS = ['password', 'passwordHash', 'token', 'secret', 'cardNumber', 'cvv', 'accessToken'];
        try {
            const serialized = JSON.parse(JSON.stringify(value));
            return Object.fromEntries(Object.entries(serialized).map(([k, v]) => [k, BLOCKED_KEYS.includes(k) ? '[REDACTED]' : v]));
        }
        catch {
            return {};
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_context_service_1.AuditContextService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map