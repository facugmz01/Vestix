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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let CustomersService = class CustomersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapCustomer(c) {
        if (!c)
            return null;
        const { creditLimit, usedCredit, ...rest } = c;
        return {
            ...rest,
            credit: {
                limit: creditLimit,
                used: usedCredit,
                available: creditLimit - usedCredit
            }
        };
    }
    async create(dto) {
        const taxId = dto.taxId === '' ? null : dto.taxId;
        const email = dto.email === '' ? null : dto.email;
        if (taxId) {
            const exists = await this.prisma.customer.findUnique({ where: { taxId } });
            if (exists)
                throw new common_1.ConflictException(`El identificador fiscal ${taxId} ya está registrado`);
        }
        const customer = await this.prisma.customer.create({
            data: {
                type: dto.type || 'INDIVIDUAL',
                fullName: dto.fullName,
                taxId: taxId,
                email: email,
                phone: dto.phone || null,
                creditLimit: dto.initialCreditLimit || 0,
                isActive: dto.isActive ?? true,
                priceListId: dto.priceListId || null,
            }
        });
        return this.mapCustomer(customer);
    }
    async findAll(query = {}) {
        const page = parseInt(query.page) || 1;
        const pageSize = parseInt(query.pageSize) || 50;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.search) {
            where.OR = [
                { fullName: { contains: query.search, mode: 'insensitive' } },
                { email: { contains: query.search, mode: 'insensitive' } },
                { taxId: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.customer.findMany({
                where,
                orderBy: { fullName: 'asc' },
                skip,
                take: pageSize,
            }),
            this.prisma.customer.count({ where }),
        ]);
        return {
            data: data.map(c => this.mapCustomer(c)),
            total,
            page,
            pageSize
        };
    }
    async findOne(id) {
        const customer = await this.prisma.customer.findUnique({ where: { id } });
        if (!customer)
            throw new common_1.NotFoundException('Cliente no encontrado');
        return this.mapCustomer(customer);
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.taxId === '')
            dto.taxId = null;
        if (dto.email === '')
            dto.email = null;
        if (dto.priceListId === '')
            dto.priceListId = null;
        if (dto.taxId) {
            const exists = await this.prisma.customer.findFirst({
                where: { taxId: dto.taxId, id: { not: id } }
            });
            if (exists)
                throw new common_1.ConflictException(`El identificador fiscal ${dto.taxId} ya está en uso`);
        }
        const updated = await this.prisma.customer.update({
            where: { id },
            data: dto,
        });
        return this.mapCustomer(updated);
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.customer.delete({ where: { id } });
    }
    async repayCredit(id, amount, reference) {
        return this.prisma.customer.update({
            where: { id },
            data: {
                usedCredit: { decrement: amount },
                updatedAt: new Date(),
            }
        });
    }
    async chargeCredit(id, amount, reference) {
        const raw = await this.prisma.customer.findUniqueOrThrow({ where: { id } });
        if (raw.usedCredit + amount > raw.creditLimit) {
        }
        return this.prisma.customer.update({
            where: { id },
            data: {
                usedCredit: { increment: amount },
                updatedAt: new Date(),
            }
        });
    }
    async bulkImportBalances(dto) {
        return this.prisma.$transaction(async (tx) => {
            let updatedCount = 0;
            const notFound = [];
            for (const row of dto.rows) {
                let customer = null;
                if (row.identifier) {
                    customer = await tx.customer.findFirst({
                        where: { taxId: row.identifier }
                    });
                    if (!customer) {
                        const byEmail = await tx.customer.findMany({
                            where: { email: { equals: row.identifier, mode: 'insensitive' } }
                        });
                        if (byEmail.length === 1)
                            customer = byEmail[0];
                    }
                    if (!customer) {
                        const byName = await tx.customer.findMany({
                            where: { fullName: { equals: row.identifier, mode: 'insensitive' } }
                        });
                        if (byName.length === 1)
                            customer = byName[0];
                    }
                }
                if (!customer) {
                    notFound.push(row.identifier);
                    continue;
                }
                const newUsedCredit = dto.resolution === 'overwrite'
                    ? row.balance
                    : customer.usedCredit + row.balance;
                await tx.customer.update({
                    where: { id: customer.id },
                    data: { usedCredit: newUsedCredit }
                });
                updatedCount++;
            }
            return { success: true, updatedCount, notFound };
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map