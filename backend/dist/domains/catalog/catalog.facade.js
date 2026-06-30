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
exports.CatalogFacade = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../core/prisma/prisma.service");
let CatalogFacade = class CatalogFacade {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getVariantWithCombos(variantId, tx) {
        const db = tx || this.prisma;
        return db.productVariant.findUnique({
            where: { id: variantId },
            include: { product: { include: { comboLines: true } } }
        });
    }
    async getVariantsDetails(variantIds, tx) {
        const db = tx || this.prisma;
        return db.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: { product: true }
        });
    }
};
exports.CatalogFacade = CatalogFacade;
exports.CatalogFacade = CatalogFacade = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogFacade);
//# sourceMappingURL=catalog.facade.js.map