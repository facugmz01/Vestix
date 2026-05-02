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
exports.BranchesService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let BranchesService = class BranchesService {
    constructor() {
        this.branches = [];
        this.configs = [];
    }
    async create(createBranchDto) {
        const { config, ...branchData } = createBranchDto;
        const exists = this.branches.find(b => b.code === branchData.code);
        if (exists)
            throw new common_1.ConflictException('Branch code must be unique');
        const branch = {
            id: crypto.randomUUID(),
            ...branchData,
            isActive: branchData.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.branches.push(branch);
        if (config) {
            this.configs.push({
                id: crypto.randomUUID(),
                branchId: branch.id,
                ...config,
                updatedAt: new Date(),
            });
        }
        return this.findOne(branch.id);
    }
    async findAll(activeOnly = false) {
        if (activeOnly)
            return this.branches.filter(b => b.isActive);
        return this.branches;
    }
    async findOne(id) {
        const branch = this.branches.find(b => b.id === id);
        if (!branch)
            throw new common_1.NotFoundException(`Branch ${id} not found`);
        const config = this.configs.find(c => c.branchId === id) || null;
        return { ...branch, config };
    }
    async update(id, updateBranchDto) {
        const idx = this.branches.findIndex(b => b.id === id);
        if (idx === -1)
            throw new common_1.NotFoundException(`Branch ${id} not found`);
        const { config, ...branchData } = updateBranchDto;
        this.branches[idx] = { ...this.branches[idx], ...branchData, updatedAt: new Date() };
        if (config) {
            await this.updateConfig(id, config);
        }
        return this.findOne(id);
    }
    async updateConfig(branchId, updateConfigDto) {
        const idx = this.configs.findIndex(c => c.branchId === branchId);
        if (idx === -1) {
            this.configs.push({
                id: crypto.randomUUID(),
                branchId,
                ...updateConfigDto,
                timezone: updateConfigDto.timezone || 'UTC',
                isPosEnabled: updateConfigDto.isPosEnabled ?? false,
                updatedAt: new Date()
            });
        }
        else {
            this.configs[idx] = { ...this.configs[idx], ...updateConfigDto, updatedAt: new Date() };
        }
        return this.configs.find(c => c.branchId === branchId);
    }
    async assignUserToBranch(branchId, userId) {
        return {
            success: true,
            message: `User ${userId} successfully authorized for Branch ${branchId}`
        };
    }
};
exports.BranchesService = BranchesService;
exports.BranchesService = BranchesService = __decorate([
    (0, common_1.Injectable)()
], BranchesService);
//# sourceMappingURL=branches.service.js.map