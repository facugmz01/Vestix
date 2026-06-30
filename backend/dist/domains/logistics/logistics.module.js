"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("../../core/prisma/prisma.module");
const inventory_service_1 = require("./inventory.service");
const stock_movement_service_1 = require("./stock-movement.service");
const transfers_service_1 = require("./transfers/transfers.service");
const reservations_service_1 = require("./reservations/reservations.service");
const reservation_expiry_job_1 = require("./reservation-expiry.job");
const inventory_controller_1 = require("./inventory.controller");
const branches_service_1 = require("./branches.service");
const branches_controller_1 = require("./branches.controller");
const locations_controller_1 = require("./locations.controller");
const warehouses_service_1 = require("./warehouses.service");
const warehouses_controller_1 = require("./warehouses.controller");
let LogisticsModule = class LogisticsModule {
};
exports.LogisticsModule = LogisticsModule;
exports.LogisticsModule = LogisticsModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [schedule_1.ScheduleModule.forRoot(), prisma_module_1.PrismaModule],
        controllers: [
            inventory_controller_1.InventoryController,
            branches_controller_1.BranchesController,
            locations_controller_1.LocationsController,
            warehouses_controller_1.WarehousesController,
        ],
        providers: [
            inventory_service_1.InventoryService,
            stock_movement_service_1.StockMovementService,
            transfers_service_1.TransfersService,
            reservations_service_1.ReservationsService,
            reservation_expiry_job_1.ReservationExpiryJob,
            branches_service_1.BranchesService,
            warehouses_service_1.WarehousesService,
        ],
        exports: [
            inventory_service_1.InventoryService,
            stock_movement_service_1.StockMovementService,
            transfers_service_1.TransfersService,
            reservations_service_1.ReservationsService,
            branches_service_1.BranchesService,
            warehouses_service_1.WarehousesService,
        ],
    })
], LogisticsModule);
//# sourceMappingURL=logistics.module.js.map