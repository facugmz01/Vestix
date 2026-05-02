"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineModule = void 0;
const common_1 = require("@nestjs/common");
const sync_engine_service_1 = require("./sync-engine.service");
const conflict_resolution_service_1 = require("./conflict-resolution.service");
const offline_controller_1 = require("./offline.controller");
const sales_module_1 = require("../sales/sales.module");
let OfflineModule = class OfflineModule {
};
exports.OfflineModule = OfflineModule;
exports.OfflineModule = OfflineModule = __decorate([
    (0, common_1.Module)({
        imports: [sales_module_1.SalesModule],
        controllers: [offline_controller_1.OfflineController],
        providers: [sync_engine_service_1.SyncEngineService, conflict_resolution_service_1.ConflictResolutionService],
        exports: [sync_engine_service_1.SyncEngineService],
    })
], OfflineModule);
//# sourceMappingURL=offline.module.js.map