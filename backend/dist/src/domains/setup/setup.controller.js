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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupController = void 0;
const common_1 = require("@nestjs/common");
const setup_service_1 = require("./setup.service");
let SetupController = class SetupController {
    constructor(setupService) {
        this.setupService = setupService;
    }
    async getStatus() {
        const isInitialized = await this.setupService.isSystemInitialized();
        return { isInitialized };
    }
    async createAdmin(body) {
        const isInitialized = await this.setupService.isSystemInitialized();
        if (isInitialized) {
            throw new common_1.BadRequestException('El sistema ya fue configurado. No se puede crear otro admin desde el setup.');
        }
        return this.setupService.createSuperAdmin(body);
    }
    async saveCompany(body) {
        const isInitialized = await this.setupService.isSystemInitialized();
        if (!isInitialized) {
            throw new common_1.BadRequestException('Primero debés crear un Super Administrador.');
        }
        const hasCompany = await this.setupService.isCompanyConfigured();
        if (hasCompany) {
            throw new common_1.BadRequestException('La empresa ya fue configurada. Usá el módulo de Configuraciones para modificar los datos.');
        }
        return this.setupService.saveCompanyInfo(body);
    }
};
exports.SetupController = SetupController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SetupController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Post)('admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SetupController.prototype, "createAdmin", null);
__decorate([
    (0, common_1.Post)('company'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SetupController.prototype, "saveCompany", null);
exports.SetupController = SetupController = __decorate([
    (0, common_1.Controller)('setup'),
    __metadata("design:paramtypes", [setup_service_1.SetupService])
], SetupController);
//# sourceMappingURL=setup.controller.js.map