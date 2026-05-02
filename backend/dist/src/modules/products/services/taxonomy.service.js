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
exports.CategoriesService = exports.BrandsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
let BrandsService = class BrandsService {
    constructor() {
        this.brands = [];
    }
    async create(createBrandDto) {
        const exists = this.brands.find(b => b.name === createBrandDto.name);
        if (exists)
            throw new common_1.ConflictException('Brand name already exists');
        const brand = { id: crypto.randomUUID(), ...createBrandDto, createdAt: new Date() };
        this.brands.push(brand);
        return brand;
    }
    async findAll() { return this.brands; }
    async findOne(id) {
        const brand = this.brands.find(b => b.id === id);
        if (!brand)
            throw new common_1.NotFoundException(`Brand ${id} not found`);
        return brand;
    }
};
exports.BrandsService = BrandsService;
exports.BrandsService = BrandsService = __decorate([
    (0, common_1.Injectable)()
], BrandsService);
let CategoriesService = class CategoriesService {
    constructor() {
        this.categories = [];
    }
    async create(createCategoryDto) {
        if (createCategoryDto.parentId) {
            await this.findOne(createCategoryDto.parentId);
        }
        const category = { id: crypto.randomUUID(), ...createCategoryDto, createdAt: new Date() };
        this.categories.push(category);
        return category;
    }
    async findAll() { return this.categories; }
    async findOne(id) {
        const category = this.categories.find(c => c.id === id);
        if (!category)
            throw new common_1.NotFoundException(`Category ${id} not found`);
        return category;
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)()
], CategoriesService);
//# sourceMappingURL=taxonomy.service.js.map