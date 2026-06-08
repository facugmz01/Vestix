"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcurementModule = void 0;
const common_1 = require("@nestjs/common");
const purchasing_service_1 = require("./purchasing.service");
const purchasing_controller_1 = require("./purchasing.controller");
const receipts_controller_1 = require("./receipts/receipts.controller");
const goods_receipt_service_1 = require("./receipts/goods-receipt.service");
const suppliers_service_1 = require("./suppliers.service");
const suppliers_controller_1 = require("./suppliers.controller");
const prisma_module_1 = require("../../core/prisma/prisma.module");
let ProcurementModule = class ProcurementModule {
};
exports.ProcurementModule = ProcurementModule;
exports.ProcurementModule = ProcurementModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [
            purchasing_controller_1.PurchasingController,
            receipts_controller_1.ReceiptsController,
            suppliers_controller_1.SuppliersController,
        ],
        providers: [
            purchasing_service_1.PurchasingService,
            goods_receipt_service_1.GoodsReceiptService,
            suppliers_service_1.SuppliersService,
        ],
        exports: [
            purchasing_service_1.PurchasingService,
            goods_receipt_service_1.GoodsReceiptService,
            suppliers_service_1.SuppliersService,
        ],
    })
], ProcurementModule);
//# sourceMappingURL=procurement.module.js.map