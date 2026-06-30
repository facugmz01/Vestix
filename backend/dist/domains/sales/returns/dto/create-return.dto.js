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
exports.CreateReturnDto = exports.ReturnCondition = exports.ReturnAction = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var ReturnAction;
(function (ReturnAction) {
    ReturnAction["REFUND"] = "REFUND";
    ReturnAction["EXCHANGE"] = "EXCHANGE";
    ReturnAction["STORE_CREDIT"] = "STORE_CREDIT";
})(ReturnAction || (exports.ReturnAction = ReturnAction = {}));
var ReturnCondition;
(function (ReturnCondition) {
    ReturnCondition["SELLABLE"] = "SELLABLE";
    ReturnCondition["DAMAGED"] = "DAMAGED";
    ReturnCondition["DEFECTIVE"] = "DEFECTIVE";
})(ReturnCondition || (exports.ReturnCondition = ReturnCondition = {}));
class CreateReturnItemDto {
}
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReturnItemDto.prototype, "orderLineId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReturnItemDto.prototype, "variantId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateReturnItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ReturnCondition),
    __metadata("design:type", String)
], CreateReturnItemDto.prototype, "condition", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateReturnItemDto.prototype, "reason", void 0);
class CreateReturnDto {
}
exports.CreateReturnDto = CreateReturnDto;
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "saleOrderId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)('4'),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ReturnAction),
    __metadata("design:type", String)
], CreateReturnDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateReturnItemDto),
    __metadata("design:type", Array)
], CreateReturnDto.prototype, "items", void 0);
//# sourceMappingURL=create-return.dto.js.map