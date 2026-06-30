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
exports.SaleOrderRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
let SaleOrderRepository = class SaleOrderRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const cleanId = id.replace(/^[VP]-/i, '');
        return this.prisma.saleOrder.findFirst({
            where: {
                OR: [
                    { id: { equals: id } },
                    { id: { startsWith: cleanId, mode: 'insensitive' } }
                ]
            },
            include: {
                lines: true,
                variance: true,
                customer: true
            }
        });
    }
    async findRecentByBranch(branchId, take = 50) {
        return this.prisma.saleOrder.findMany({
            where: { branchId },
            orderBy: { createdAt: 'desc' },
            take,
            include: { lines: true, customer: true }
        });
    }
    async findPaginated(where, skip, take) {
        const [data, total] = await Promise.all([
            this.prisma.saleOrder.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: { lines: true, customer: true }
            }),
            this.prisma.saleOrder.count({ where })
        ]);
        return { data, total };
    }
    async updateStatus(id, status) {
        return this.prisma.saleOrder.update({
            where: { id },
            data: { status }
        });
    }
};
exports.SaleOrderRepository = SaleOrderRepository;
exports.SaleOrderRepository = SaleOrderRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SaleOrderRepository);
//# sourceMappingURL=sale-order.repository.js.map