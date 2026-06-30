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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashRegistersController = void 0;
const common_1 = require("@nestjs/common");
const require_permissions_decorator_1 = require("../../core/rbac/decorators/require-permissions.decorator");
const common_2 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const permissions_guard_1 = require("../../core/rbac/guards/permissions.guard");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const class_validator_1 = require("class-validator");
class CreateCashRegisterDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCashRegisterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCashRegisterDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCashRegisterDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCashRegisterDto.prototype, "isActive", void 0);
let CashRegistersController = class CashRegistersController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const code = dto.code || dto.name.toUpperCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
        return this.prisma.cashRegister.create({
            data: {
                name: dto.name,
                code: code,
                branchId: dto.branchId,
                isActive: dto.isActive ?? true,
            },
            include: { branch: true }
        });
    }
    async findAll(query) {
        const page = parseInt(query.page) || 1;
        const pageSize = parseInt(query.pageSize) || 15;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.branchId)
            where.branchId = query.branchId;
        if (query.isActive !== undefined)
            where.isActive = query.isActive === 'true';
        const [data, total] = await Promise.all([
            this.prisma.cashRegister.findMany({
                where,
                include: { branch: true },
                orderBy: { name: 'asc' },
                skip,
                take: pageSize,
            }),
            this.prisma.cashRegister.count({ where }),
        ]);
        return { data, total, page, pageSize };
    }
    findOne(id) {
        return this.prisma.cashRegister.findUniqueOrThrow({
            where: { id },
            include: { branch: true }
        });
    }
    update(id, dto) {
        return this.prisma.cashRegister.update({
            where: { id },
            data: dto,
            include: { branch: true }
        });
    }
    remove(id) {
        return this.prisma.cashRegister.delete({ where: { id } });
    }
};
exports.CashRegistersController = CashRegistersController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateCashRegisterDto]),
    __metadata("design:returntype", Promise)
], CashRegistersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Settings' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CashRegistersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'read', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)({ action: 'manage', subject: 'Settings' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CashRegistersController.prototype, "remove", null);
exports.CashRegistersController = CashRegistersController = __decorate([
    (0, common_1.Controller)('cash-registers'),
    (0, common_2.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CashRegistersController);
//# sourceMappingURL=cash-registers.controller.js.map