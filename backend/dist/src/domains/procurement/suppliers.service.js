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
exports.SuppliersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
const paginate_1 = require("../../core/prisma/paginate");
let SuppliersService = class SuppliersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapSupplier(s) {
        if (!s)
            return null;
        const { balance, currency, ...rest } = s;
        return {
            ...rest,
            account: { balance, currency }
        };
    }
    async createSupplier(dto) {
        const taxId = dto.taxId === '' ? null : dto.taxId;
        const email = dto.email === '' ? null : dto.email;
        if (taxId) {
            const exists = await this.prisma.supplier.findUnique({ where: { taxId } });
            if (exists)
                throw new common_1.ConflictException(`El CUIT ${taxId} ya está registrado`);
        }
        const supplier = await this.prisma.supplier.create({
            data: {
                companyName: dto.companyName,
                contactName: dto.contactName || null,
                taxId: taxId,
                email: email,
                phone: dto.phone || null,
                balance: dto.initialBalance || 0,
                currency: dto.currency || 'ARS',
            }
        });
        return this.mapSupplier(supplier);
    }
    async findAll(query = {}) {
        const result = await (0, paginate_1.paginate)(this.prisma.supplier, query, {
            searchFields: ['companyName', 'contactName', 'taxId'],
            orderBy: { companyName: 'asc' },
        });
        return {
            ...result,
            data: result.data.map(s => this.mapSupplier(s)),
        };
    }
    async getSupplier(id) {
        const supplier = await this.prisma.supplier.findUnique({ where: { id } });
        if (!supplier)
            throw new common_1.NotFoundException('Proveedor no encontrado');
        return this.mapSupplier(supplier);
    }
    async updateSupplier(id, dto) {
        await this.getSupplier(id);
        if (dto.taxId === '')
            dto.taxId = null;
        if (dto.email === '')
            dto.email = null;
        const updated = await this.prisma.supplier.update({
            where: { id },
            data: dto,
        });
        return this.mapSupplier(updated);
    }
    async deleteSupplier(id) {
        await this.getSupplier(id);
        return this.prisma.supplier.delete({ where: { id } });
    }
    async bulkImportBalances(dto) {
        return this.prisma.$transaction(async (tx) => {
            let updatedCount = 0;
            const notFound = [];
            for (const row of dto.rows) {
                let supplier = null;
                if (row.identifier) {
                    supplier = await tx.supplier.findFirst({
                        where: { taxId: row.identifier }
                    });
                    if (!supplier) {
                        const byEmail = await tx.supplier.findMany({
                            where: { email: { equals: row.identifier, mode: 'insensitive' } }
                        });
                        if (byEmail.length === 1)
                            supplier = byEmail[0];
                    }
                    if (!supplier) {
                        const byName = await tx.supplier.findMany({
                            where: { companyName: { equals: row.identifier, mode: 'insensitive' } }
                        });
                        if (byName.length === 1)
                            supplier = byName[0];
                    }
                }
                if (!supplier) {
                    notFound.push(row.identifier);
                    continue;
                }
                const newBalance = dto.resolution === 'overwrite'
                    ? row.balance
                    : supplier.balance + row.balance;
                await tx.supplier.update({
                    where: { id: supplier.id },
                    data: { balance: newBalance }
                });
                updatedCount++;
            }
            return { success: true, updatedCount, notFound };
        });
    }
};
exports.SuppliersService = SuppliersService;
exports.SuppliersService = SuppliersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuppliersService);
//# sourceMappingURL=suppliers.service.js.map