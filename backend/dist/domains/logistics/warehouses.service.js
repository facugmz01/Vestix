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
exports.WarehousesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const paginate_1 = require("../../core/prisma/paginate");
let WarehousesService = class WarehousesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        if (dto.code) {
            const exists = await this.prisma.warehouse.findUnique({ where: { code: dto.code } });
            if (exists)
                throw new common_1.ConflictException(`El código de depósito "${dto.code}" ya existe`);
        }
        return this.prisma.warehouse.create({
            data: {
                name: dto.name,
                code: dto.code,
                type: dto.type || 'STORAGE',
                address: dto.address,
                branchId: dto.branchId,
                isActive: dto.isActive ?? true,
            },
            include: { branch: true }
        });
    }
    async findAll(query = {}) {
        const extraWhere = {};
        if (query.branchId)
            extraWhere.branchId = query.branchId;
        if (query.type)
            extraWhere.type = query.type;
        if (query.isActive !== undefined)
            extraWhere.isActive = query.isActive === 'true';
        return (0, paginate_1.paginate)(this.prisma.warehouse, query, {
            searchFields: ['name', 'code'],
            where: extraWhere,
            orderBy: { name: 'asc' },
            include: { branch: true },
        });
    }
    async findOne(id) {
        const warehouse = await this.prisma.warehouse.findUnique({
            where: { id },
            include: { branch: true }
        });
        if (!warehouse)
            throw new common_1.NotFoundException(`Depósito ${id} no encontrado`);
        return warehouse;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.code) {
            const exists = await this.prisma.warehouse.findFirst({
                where: { code: dto.code, id: { not: id } }
            });
            if (exists)
                throw new common_1.ConflictException(`El código de depósito "${dto.code}" ya está en uso`);
        }
        return this.prisma.warehouse.update({
            where: { id },
            data: dto,
            include: { branch: true }
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.warehouse.delete({ where: { id } });
    }
};
exports.WarehousesService = WarehousesService;
exports.WarehousesService = WarehousesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarehousesService);
//# sourceMappingURL=warehouses.service.js.map