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
exports.UpdateSettingsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class StoreSettingsDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StoreSettingsDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StoreSettingsDto.prototype, "legalName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StoreSettingsDto.prototype, "cuit", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StoreSettingsDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StoreSettingsDto.prototype, "timezone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StoreSettingsDto.prototype, "logoUrl", void 0);
class SkuSettingsDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SkuSettingsDto.prototype, "prefix", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SkuSettingsDto.prototype, "includeCategory", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SkuSettingsDto.prototype, "includeBrand", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SkuSettingsDto.prototype, "includeColor", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SkuSettingsDto.prototype, "includeSize", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SkuSettingsDto.prototype, "separator", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SkuSettingsDto.prototype, "uppercased", void 0);
class BarcodeSettingsDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BarcodeSettingsDto.prototype, "companyPrefix", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BarcodeSettingsDto.prototype, "autoGenerate", void 0);
class PricingSettingsDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], PricingSettingsDto.prototype, "defaultVatRate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], PricingSettingsDto.prototype, "defaultMarginTarget", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PricingSettingsDto.prototype, "allowNegativeMargin", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PricingSettingsDto.prototype, "roundToNearest", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PricingSettingsDto.prototype, "defaultRetailPriceListId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PricingSettingsDto.prototype, "defaultWholesalePriceListId", void 0);
class InventorySettingsDto {
}
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], InventorySettingsDto.prototype, "allowNegativeStock", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], InventorySettingsDto.prototype, "defaultReorderPoint", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], InventorySettingsDto.prototype, "reservationTtlMinutes", void 0);
class OfflineSettingsDto {
}
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], OfflineSettingsDto.prototype, "maxOfflineHours", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OfflineSettingsDto.prototype, "requireManagerPinForReturns", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], OfflineSettingsDto.prototype, "requireManagerPinForDiscounts", void 0);
class UpdateSettingsDto {
}
exports.UpdateSettingsDto = UpdateSettingsDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => StoreSettingsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", StoreSettingsDto)
], UpdateSettingsDto.prototype, "store", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => SkuSettingsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", SkuSettingsDto)
], UpdateSettingsDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => BarcodeSettingsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", BarcodeSettingsDto)
], UpdateSettingsDto.prototype, "barcode", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PricingSettingsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", PricingSettingsDto)
], UpdateSettingsDto.prototype, "pricing", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => InventorySettingsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", InventorySettingsDto)
], UpdateSettingsDto.prototype, "inventory", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => OfflineSettingsDto),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", OfflineSettingsDto)
], UpdateSettingsDto.prototype, "offline", void 0);
//# sourceMappingURL=update-settings.dto.js.map