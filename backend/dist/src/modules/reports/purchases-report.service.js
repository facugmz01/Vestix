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
exports.PurchasesReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let PurchasesReportService = class PurchasesReportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPurchasesSummary(params) {
        const { from, to } = params;
        const orders = await this.prisma.purchaseOrder.findMany({
            where: {
                createdAt: { gte: from, lte: to },
                status: { not: 'CANCELLED' }
            },
            include: {
                supplier: true,
            }
        });
        let totalAmount = 0;
        let totalReceived = 0;
        let pendingAmount = 0;
        const supplierMap = new Map();
        for (const order of orders) {
            totalAmount += order.totalAmount;
            totalReceived += order.paidAmount;
            pendingAmount += (order.totalAmount - order.paidAmount);
            const supplierName = order.supplier.companyName;
            const currentVal = supplierMap.get(supplierName) ?? 0;
            supplierMap.set(supplierName, currentVal + order.totalAmount);
        }
        const topSuppliers = Array.from(supplierMap.entries())
            .map(([supplierName, totalAmount]) => ({ supplierName, totalAmount }))
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 5);
        return {
            period: { from, to },
            totalOrders: orders.length,
            totalAmount,
            totalReceived,
            pendingAmount,
            topSuppliers,
        };
    }
};
exports.PurchasesReportService = PurchasesReportService;
exports.PurchasesReportService = PurchasesReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchasesReportService);
//# sourceMappingURL=purchases-report.service.js.map