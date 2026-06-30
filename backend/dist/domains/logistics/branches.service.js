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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const paginate_1 = require("../../core/prisma/paginate");
let BranchesService = class BranchesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createBranchDto) {
        const { config, settings, ...branchData } = createBranchDto;
        const exists = await this.prisma.branch.findUnique({ where: { code: branchData.code } });
        if (exists)
            throw new common_1.ConflictException('El código de sucursal ya existe');
        return this.prisma.branch.create({
            data: {
                name: branchData.name,
                code: branchData.code,
                address: branchData.address,
                phone: branchData.phone,
                isMain: branchData.isMain ?? false,
                isActive: branchData.isActive ?? true,
                settings: settings ?? config ?? undefined,
            },
            include: { warehouses: true }
        });
    }
    async findAll(query = {}) {
        const result = await (0, paginate_1.paginate)(this.prisma.branch, query, {
            searchFields: ['name', 'code'],
            orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
            include: { warehouses: true },
        });
        return {
            ...result,
            data: result.data.map(b => ({ ...b, userCount: 0 })),
        };
    }
    async findOne(id) {
        const branch = await this.prisma.branch.findUnique({
            where: { id },
            include: { warehouses: true }
        });
        if (!branch)
            throw new common_1.NotFoundException(`Sucursal ${id} no encontrada`);
        return branch;
    }
    async update(id, updateBranchDto) {
        await this.findOne(id);
        const { config, settings, ...branchData } = updateBranchDto;
        return this.prisma.branch.update({
            where: { id },
            data: {
                ...branchData,
                settings: settings ?? config ?? undefined,
                updatedAt: new Date(),
            },
            include: { warehouses: true }
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.branch.delete({ where: { id } });
    }
    async assignUserToBranch(branchId, userId) {
        return {
            success: true,
            message: `User ${userId} successfully authorized for Branch ${branchId}`
        };
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesService);
//# sourceMappingURL=branches.service.js.map