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
exports.CashReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let CashReportService = class CashReportService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getCashSummary(params) {
        const { from, to, branchId } = params;
        const accountFilter = branchId ? { branchId } : {};
        const transactions = await this.prisma.financialTransaction.findMany({
            where: {
                createdAt: { gte: from, lte: to },
                account: accountFilter
            },
            include: {
                account: true
            }
        });
        let totalIncome = 0;
        let totalExpenses = 0;
        const methodMap = new Map();
        const dailyMap = new Map();
        for (const t of transactions) {
            const dateKey = t.createdAt.toISOString().split('T')[0];
            if (!dailyMap.has(dateKey)) {
                dailyMap.set(dateKey, { income: 0, expenses: 0 });
            }
            const dayStats = dailyMap.get(dateKey);
            const method = t.account.type;
            if (t.type === 'CREDIT') {
                totalIncome += t.amount;
                dayStats.income += t.amount;
                methodMap.set(method, (methodMap.get(method) ?? 0) + t.amount);
            }
            else if (t.type === 'DEBIT') {
                totalExpenses += t.amount;
                dayStats.expenses += t.amount;
            }
        }
        const byMethod = Array.from(methodMap.entries()).map(([method, amount]) => ({ method, amount }));
        const dailySeries = Array.from(dailyMap.entries())
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => a.date.localeCompare(b.date));
        return {
            period: { from, to },
            totalIncome,
            totalExpenses,
            netCash: totalIncome - totalExpenses,
            byMethod,
            dailySeries
        };
    }
};
exports.CashReportService = CashReportService;
exports.CashReportService = CashReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CashReportService);
//# sourceMappingURL=cash-report.service.js.map