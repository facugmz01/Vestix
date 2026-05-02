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
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
const audit_log_model_1 = require("../audit/models/audit-log.model");
let SettingsService = SettingsService_1 = class SettingsService {
    constructor(auditService) {
        this.auditService = auditService;
        this.logger = new common_1.Logger(SettingsService_1.name);
        this.settings = {
            version: 1,
            store: {
                name: 'Mi Tienda',
                legalName: 'Mi Tienda SRL',
                cuit: '30-00000000-0',
                currency: 'ARS',
                timezone: 'America/Argentina/Buenos_Aires',
            },
            sku: {
                prefix: 'TDA',
                includeCategory: true,
                includeBrand: false,
                includeColor: true,
                includeSize: true,
                separator: '-',
                uppercased: true,
            },
            barcode: {
                companyPrefix: '0400000',
                autoGenerate: true,
            },
            pricing: {
                defaultVatRate: 0.21,
                defaultMarginTarget: 0.45,
                allowNegativeMargin: false,
                roundToNearest: 0.5,
                defaultRetailPriceListId: 'retail-default',
            },
            inventory: {
                allowNegativeStock: false,
                defaultReorderPoint: 5,
                reservationTtlMinutes: 15,
            },
            offline: {
                maxOfflineHours: 8,
                requireManagerPinForReturns: true,
                requireManagerPinForDiscounts: true,
            },
            updatedAt: new Date(),
            updatedByUserId: 'system',
        };
    }
    getSettings() {
        return Object.freeze({ ...this.settings });
    }
    async updateSettings(dto, userId) {
        const previous = { ...this.settings };
        this.settings = {
            ...this.settings,
            ...(dto.store && { store: { ...this.settings.store, ...dto.store } }),
            ...(dto.sku && { sku: { ...this.settings.sku, ...dto.sku } }),
            ...(dto.barcode && { barcode: { ...this.settings.barcode, ...dto.barcode } }),
            ...(dto.pricing && { pricing: { ...this.settings.pricing, ...dto.pricing } }),
            ...(dto.inventory && { inventory: { ...this.settings.inventory, ...dto.inventory } }),
            ...(dto.offline && { offline: { ...this.settings.offline, ...dto.offline } }),
            version: this.settings.version + 1,
            updatedAt: new Date(),
            updatedByUserId: userId,
        };
        this.logger.log(`[Settings] Updated to v${this.settings.version} by user ${userId}`);
        await this.auditService.log({
            userId,
            action: audit_log_model_1.AuditAction.UPDATE,
            resource: 'SystemSettings',
            resourceId: 'singleton',
            module: 'SettingsService',
            previousValue: previous,
            newValue: this.settings,
            description: `System settings updated to version ${this.settings.version}`,
        });
        return this.settings;
    }
    getSkuRules() { return this.settings.sku; }
    getBarcodeRules() { return this.settings.barcode; }
    getPricingRules() { return this.settings.pricing; }
    getInventoryRules() { return this.settings.inventory; }
    getOfflineRules() { return this.settings.offline; }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map