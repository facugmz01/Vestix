"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehousesService = void 0;
const common_1 = require("@nestjs/common");
const warehouse_model_1 = require("./models/warehouse.model");
const crypto = __importStar(require("crypto"));
let WarehousesService = class WarehousesService {
    constructor() {
        this.warehouses = [];
    }
    async create(createWarehouseDto) {
        const exists = this.warehouses.some(w => w.code === createWarehouseDto.code);
        if (exists) {
            throw new common_1.ConflictException(`Warehouse with code ${createWarehouseDto.code} already exists`);
        }
        if (createWarehouseDto.type === warehouse_model_1.WarehouseType.STORE_FRONT && !createWarehouseDto.branchId) {
            throw new common_1.BadRequestException('A STORE_FRONT warehouse MUST be linked to a branchId');
        }
        const warehouse = {
            id: crypto.randomUUID(),
            ...createWarehouseDto,
            branchId: createWarehouseDto.branchId || null,
            isActive: createWarehouseDto.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.warehouses.push(warehouse);
        return warehouse;
    }
    async findAll(branchId) {
        if (branchId) {
            return this.warehouses.filter(w => w.branchId === branchId);
        }
        return this.warehouses;
    }
    async findOne(id) {
        const warehouse = this.warehouses.find(w => w.id === id);
        if (!warehouse)
            throw new common_1.NotFoundException(`Warehouse ${id} not found`);
        return warehouse;
    }
    async update(id, updateWarehouseDto) {
        const idx = this.warehouses.findIndex(w => w.id === id);
        if (idx === -1)
            throw new common_1.NotFoundException(`Warehouse ${id} not found`);
        if (updateWarehouseDto.code) {
            const exists = this.warehouses.find(w => w.code === updateWarehouseDto.code && w.id !== id);
            if (exists)
                throw new common_1.ConflictException(`Code ${updateWarehouseDto.code} is already taken`);
        }
        this.warehouses[idx] = {
            ...this.warehouses[idx],
            ...updateWarehouseDto,
            updatedAt: new Date()
        };
        return this.warehouses[idx];
    }
};
exports.WarehousesService = WarehousesService;
exports.WarehousesService = WarehousesService = __decorate([
    (0, common_1.Injectable)()
], WarehousesService);
//# sourceMappingURL=warehouses.service.js.map